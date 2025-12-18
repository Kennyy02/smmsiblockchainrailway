import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, UserCheck, Users, Clock, Eye, UserPlus, UserMinus, CheckSquare, Square, AlertCircle, BookOpen } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminClassesService, 
    Class, 
    ClassFormData, 
    ClassStats, 
    ClassesResponse, 
    ApiResponse,
    AcademicYear,
    Semester,
    Teacher,
    Student,
    Course
} from '../../../services/AdminClassesService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// Format grade level display
const formatGradeLevel = (grade: number): string => {
    if (grade >= 13) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return yearNames[grade - 13] || `${grade - 12}th Year`;
    }
    return `Grade ${grade}`;
};

// Get all grade level options (Grade 1-12 + College 1st-4th Year)
const getAllGradeLevelOptions = () => [
    { value: 1, label: 'Grade 1', level: 'Elementary' },
    { value: 2, label: 'Grade 2', level: 'Elementary' },
    { value: 3, label: 'Grade 3', level: 'Elementary' },
    { value: 4, label: 'Grade 4', level: 'Elementary' },
    { value: 5, label: 'Grade 5', level: 'Elementary' },
    { value: 6, label: 'Grade 6', level: 'Elementary' },
    { value: 7, label: 'Grade 7', level: 'Junior High' },
    { value: 8, label: 'Grade 8', level: 'Junior High' },
    { value: 9, label: 'Grade 9', level: 'Junior High' },
    { value: 10, label: 'Grade 10', level: 'Junior High' },
    { value: 11, label: 'Grade 11', level: 'Senior High' },
    { value: 12, label: 'Grade 12', level: 'Senior High' },
    { value: 13, label: '1st Year', level: 'College' },
    { value: 14, label: '2nd Year', level: 'College' },
    { value: 15, label: '3rd Year', level: 'College' },
    { value: 16, label: '4th Year', level: 'College' },
];

// Check if grade level requires a course (Senior High Grade 11-12 or College)
const requiresCourse = (grade: number): boolean => grade >= 11;

// ========================================================================
// 📋 INTERFACES 
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    program: string;
    year_level: string;
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
// 🔔 NOTIFICATION COMPONENT
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
// 📝 CLASS MODAL (WITH DROPDOWN SELECTS)
// ========================================================================

// Helper function to get grade level to course level mapping
const getGradeLevelCategory = (grade: number): string => {
    if (grade >= 1 && grade <= 6) return 'Elementary';
    if (grade >= 7 && grade <= 10) return 'Junior High';
    if (grade >= 11 && grade <= 12) return 'Senior High';
    if (grade >= 13 && grade <= 16) return 'College';
    return '';
};

// Helper function to generate class code
const generateClassCode = (yearLevel: number, courseCode: string, section: string): string => {
    if (!section) return '';
    
    // For college (grade 13-16), use CourseCode-YearSection (e.g., BSIT-1A)
    if (yearLevel >= 13) {
        const collegeYear = yearLevel - 12; // Convert 13->1, 14->2, etc.
        if (courseCode) {
            return `${courseCode}-${collegeYear}${section.toUpperCase()}`;
        }
        return '';
    }
    
    // For K-12, use Grade-Section (e.g., 7-A or Grade7-A)
    return `Grade${yearLevel}-${section.toUpperCase()}`;
};

// Helper function to generate class name
const generateClassName = (yearLevel: number, courseCode: string, section: string): string => {
    if (!section) return '';
    
    // For college, use same as class code
    if (yearLevel >= 13) {
        const collegeYear = yearLevel - 12;
        if (courseCode) {
            return `${courseCode}-${collegeYear}${section.toUpperCase()}`;
        }
        return '';
    }
    
    // For K-12, use Grade Level Section format
    return `Grade ${yearLevel} - Section ${section.toUpperCase()}`;
};

const ClassModal: React.FC<{
    classItem: Class | null;
    onClose: () => void;
    onSave: (data: ClassFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ classItem, onClose, onSave, errors }) => {

    const [formData, setFormData] = useState<ClassFormData>({
        class_code: classItem?.class_code || '',
        class_name: classItem?.class_name || '',
        year_level: classItem?.year_level || 1,
        section: classItem?.section || '',
        program: classItem?.program || '',
        course_id: classItem?.course_id || null,
        academic_year_id: classItem?.academic_year_id || 0,
        semester_id: classItem?.semester_id || 0,
        adviser_id: classItem?.adviser_id || null,
    });

    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    
    // Dropdown options state
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);

    // Load dropdown options on mount
    useEffect(() => {
        loadDropdownOptions();
    }, []);

    // Filter semesters when academic year changes
    useEffect(() => {
        if (formData.academic_year_id && allSemesters.length > 0) {
            const filtered = allSemesters.filter(
                sem => sem.academic_year_id === formData.academic_year_id
            );
            setSemesters(filtered);
            
            // Reset semester if current selection doesn't match new academic year
            if (formData.semester_id) {
                const semesterExists = filtered.some(sem => sem.id === formData.semester_id);
                if (!semesterExists) {
                    setFormData(prev => ({ ...prev, semester_id: filtered[0]?.id || 0 }));
                }
            }
        }
    }, [formData.academic_year_id, allSemesters]);

    // Filter courses based on grade level
    useEffect(() => {
        if (allCourses.length > 0) {
            const gradeCategory = getGradeLevelCategory(formData.year_level);
            const filtered = allCourses.filter(course => course.level === gradeCategory);
            
            // When editing, if the current course exists but isn't in filtered list,
            // add it to the list so it shows in dropdown
            if (classItem && formData.course_id) {
                const currentCourse = allCourses.find(c => c.id === formData.course_id);
                if (currentCourse && !filtered.some(c => c.id === formData.course_id)) {
                    filtered.push(currentCourse);
                }
            }
            
            setCourses(filtered);
            
            // Only reset course for NEW classes, not when editing
            if (!classItem && formData.course_id) {
                const courseExists = filtered.some(c => c.id === formData.course_id);
                if (!courseExists) {
                    setFormData(prev => ({ 
                        ...prev, 
                        course_id: null,
                        program: ''
                    }));
                }
            }
        }
    }, [formData.year_level, allCourses, classItem]);

    // Auto-generate class_code and class_name when course, year_level, or section changes
    useEffect(() => {
        // Auto-generate for both new and editing classes
        const selectedCourse = allCourses.find(c => c.id === formData.course_id);
        const courseCode = selectedCourse?.course_code || '';
        
        // For K-12 (non-college), generate without course code
        // For college, require course to be selected
        if (formData.year_level < 13 || (formData.year_level >= 13 && courseCode)) {
            const newClassCode = generateClassCode(formData.year_level, courseCode, formData.section);
            const newClassName = generateClassName(formData.year_level, courseCode, formData.section);
            
            // Only update if values actually changed to prevent infinite loops
            if (newClassCode !== formData.class_code || newClassName !== formData.class_name) {
                setFormData(prev => ({
                    ...prev,
                    class_code: newClassCode,
                    class_name: newClassName
                }));
            }
        }
    }, [formData.year_level, formData.course_id, formData.section, allCourses]);

    const loadDropdownOptions = async () => {
        setLoadingOptions(true);
        try {
            // Load all options in parallel
            const [academicYearsRes, semestersRes, teachersRes, coursesRes] = await Promise.all([
                adminClassesService.getAcademicYears(),
                adminClassesService.getSemesters(),
                adminClassesService.getTeachers({ paginate: false }),
                adminClassesService.getActiveCourses()
            ]);

            if (academicYearsRes.success) {
                setAcademicYears(academicYearsRes.data);
                
                // Set default academic year to current if creating new
                if (!classItem) {
                    const currentYear = academicYearsRes.data.find(ay => ay.is_current);
                    if (currentYear) {
                        setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }));
                    }
                }
            }

            if (semestersRes.success) {
                setAllSemesters(semestersRes.data);
                
                // Set default semester to current if creating new
                if (!classItem) {
                    const currentSemester = semestersRes.data.find(sem => sem.is_current);
                    if (currentSemester) {
                        setFormData(prev => ({ ...prev, semester_id: currentSemester.id }));
                    }
                }
            }

            if (teachersRes.success) {
                setTeachers(teachersRes.data);
            }

            if (coursesRes.success) {
                setAllCourses(coursesRes.data);
                // Initial filtering based on current year_level
                const gradeCategory = getGradeLevelCategory(formData.year_level);
                const filtered = coursesRes.data.filter((course: Course) => course.level === gradeCategory);
                
                // When editing, ensure the current course is in the filtered list
                if (classItem && formData.course_id) {
                    const currentCourse = coursesRes.data.find((c: Course) => c.id === formData.course_id);
                    if (currentCourse && !filtered.some((c: Course) => c.id === formData.course_id)) {
                        filtered.push(currentCourse);
                    }
                }
                
                setCourses(filtered);
            }
        } catch (error) {
            console.error('Error loading dropdown options:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Special handling for course selection
        if (name === 'course_id') {
            const courseId = value === '' ? null : parseInt(value);
            const selectedCourse = allCourses.find(c => c.id === courseId);
            setFormData(prev => ({ 
                ...prev, 
                course_id: courseId,
                // Auto-fill program with course code when course is selected
                program: selectedCourse ? selectedCourse.course_code : prev.program
            }));
            return;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' || name.endsWith('_id')
                ? (value === '' ? (name === 'adviser_id' ? null : 0) : parseInt(value))
                : value 
        } as ClassFormData));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {classItem ? 'Edit Class/Section' : 'Create New Class/Section'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {loadingOptions ? (
                        <div className="p-12 flex flex-col items-center justify-center">
                            <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mb-4`} />
                            <p className="text-gray-600">Loading form options...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Row 1: Grade Level (First - determines available courses) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Grade Level <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    name="year_level" 
                                    value={formData.year_level} 
                                    onChange={handleChange} 
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    <optgroup label="Elementary">
                                        {getAllGradeLevelOptions().filter(o => o.level === 'Elementary').map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Junior High">
                                        {getAllGradeLevelOptions().filter(o => o.level === 'Junior High').map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Senior High">
                                        {getAllGradeLevelOptions().filter(o => o.level === 'Senior High').map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="College">
                                        {getAllGradeLevelOptions().filter(o => o.level === 'College').map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <p className="text-gray-500 text-xs mt-1">
                                    Selected: {getGradeLevelCategory(formData.year_level)} level - Courses will be filtered accordingly
                                </p>
                                {errors.year_level && (<p className="text-red-500 text-xs mt-1">{errors.year_level[0]}</p>)}
                            </div>

                            {/* Row 2: Course/Program Dropdown (Filtered by Grade Level) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Course/Program {formData.year_level >= 11 && <span className="text-red-500">*</span>}
                                </label>
                                <select
                                    name="course_id"
                                    value={formData.course_id || ''}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required={formData.year_level >= 11}
                                >
                                    <option value="">Select Course/Program</option>
                                    {courses.length > 0 ? (
                                        courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_code} - {course.course_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No courses available for {getGradeLevelCategory(formData.year_level)}</option>
                                    )}
                                </select>
                                {courses.length === 0 && formData.year_level >= 11 && (
                                    <p className="text-amber-600 text-xs mt-1">
                                        No courses found for {getGradeLevelCategory(formData.year_level)} level. Please add courses first.
                                    </p>
                                )}
                                {errors.course_id && (<p className="text-red-500 text-xs mt-1">{errors.course_id[0]}</p>)}
                                {errors.program && (<p className="text-red-500 text-xs mt-1">{errors.program[0]}</p>)}
                            </div>
                            
                            {/* Row 3: Section */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Section <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="e.g., A, B, C"
                                    required
                                />
                                <p className="text-gray-500 text-xs mt-1">Enter section letter (e.g., A, B, C)</p>
                                {errors.section && (<p className="text-red-500 text-xs mt-1">{errors.section[0]}</p>)}
                            </div>

                            {/* Row 4: Class Code & Class Name (Auto-generated) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Class Code <span className="text-red-500">*</span>
                                        <span className="text-xs font-normal text-gray-500 ml-2">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="class_code"
                                        value={formData.class_code}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-gray-50`}
                                        placeholder={formData.year_level >= 13 ? "e.g., BSIT-1A" : "e.g., Grade7-A"}
                                        readOnly
                                        required
                                    />
                                    {errors.class_code && (<p className="text-red-500 text-xs mt-1">{errors.class_code[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Class Name <span className="text-red-500">*</span>
                                        <span className="text-xs font-normal text-gray-500 ml-2">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="class_name"
                                        value={formData.class_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-gray-50`}
                                        placeholder={formData.year_level >= 13 ? "e.g., BSIT-1A" : "e.g., Grade 7 - Section A"}
                                        readOnly
                                        required
                                    />
                                    {errors.class_name && (<p className="text-red-500 text-xs mt-1">{errors.class_name[0]}</p>)}
                                </div>
                            </div>

                            {/* Row 3: Academic Year, Semester, Adviser - NOW WITH DROPDOWNS */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Academic Year Dropdown */}
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
                                    >
                                        <option value="">Select Academic Year</option>
                                        {academicYears.map(ay => (
                                            <option key={ay.id} value={ay.id}>
                                                {ay.year_name} {ay.is_current ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.academic_year_id && (<p className="text-red-500 text-xs mt-1">{errors.academic_year_id[0]}</p>)}
                                </div>

                                {/* Semester Dropdown - Filtered by Academic Year */}
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
                                        disabled={!formData.academic_year_id}
                                    >
                                        <option value="">Select Semester</option>
                                        {semesters.map(sem => (
                                            <option key={sem.id} value={sem.id}>
                                                {sem.semester_name} {sem.is_current ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {!formData.academic_year_id && (
                                        <p className="text-gray-500 text-xs mt-1">Select academic year first</p>
                                    )}
                                    {errors.semester_id && (<p className="text-red-500 text-xs mt-1">{errors.semester_id[0]}</p>)}
                                </div>

                                {/* Adviser Dropdown - Optional */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Class Adviser (Optional)
                                    </label>
                                    <select
                                        name="adviser_id"
                                        value={formData.adviser_id || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    >
                                        <option value="">No Adviser Assigned</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.full_name} ({teacher.department})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.adviser_id && (<p className="text-red-500 text-xs mt-1">{errors.adviser_id[0]}</p>)}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                                    className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`} 
                                    disabled={loading || loadingOptions}
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </span>
                                    ) : (
                                        classItem ? 'Update Class' : 'Create Class'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👥 CLASS STUDENTS MODAL - View & Manage Enrolled Students
// ========================================================================

const ClassStudentsModal: React.FC<{
    classItem: Class;
    onClose: () => void;
    onAddStudents: () => void;
    showNotification: (type: 'success' | 'error', message: string) => void;
}> = ({ classItem, onClose, onAddStudents, showNotification }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classInfo, setClassInfo] = useState<any>(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminClassesService.getClassStudents(classItem.id, {
                search,
                per_page: 50,
            });
            if (response.success) {
                setStudents(response.data);
                setClassInfo(response.class_info);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading students:', error);
            showNotification('error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    }, [classItem.id, search]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const handleRemoveStudent = async (studentId: number, studentName: string) => {
        if (!confirm(`Are you sure you want to remove ${studentName} from this class/section?`)) {
            return;
        }

        try {
            const response = await adminClassesService.unenrollStudent(classItem.id, studentId);
            if (response.success) {
                showNotification('success', `${studentName} has been removed from this class`);
                loadStudents();
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Failed to remove student');
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Students in {classItem.class_code}
                                </h2>
                                <p className="text-white/80 text-sm mt-1">
                                    {classInfo?.class_name} • {classInfo?.academic_year} • {classInfo?.semester}
                                </p>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search students..."
                                className={`pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${RING_COLOR_CLASS}`}
                            />
                        </div>
                        <button
                            onClick={onAddStudents}
                            className={`inline-flex items-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium`}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Students
                        </button>
                    </div>

                    {/* Student List */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mb-2`} />
                                <p className="text-gray-500">Loading students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 mb-2">No students enrolled in this class</p>
                                <button
                                    onClick={onAddStudents}
                                    className={`inline-flex items-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS}`}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Students Now
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Grade Level</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full ${LIGHT_BG_CLASS} flex items-center justify-center mr-3`}>
                                                        <span className={`text-sm font-semibold ${TEXT_COLOR_CLASS}`}>
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.student_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatGradeLevel(student.year_level)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id, student.full_name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove from Class"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            {pagination.total} student{pagination.total !== 1 ? 's' : ''} in class
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// ➕ ADD STUDENTS MODAL - Bulk Enrollment
// ========================================================================

const AddStudentsModal: React.FC<{
    classItem: Class;
    onClose: () => void;
    onSuccess: () => void;
    showNotification: (type: 'success' | 'error', message: string) => void;
}> = ({ classItem, onClose, onSuccess, showNotification }) => {
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [search, setSearch] = useState('');
    const [classRequirements, setClassRequirements] = useState<{ course_code: string; course_name: string; year_level: number } | null>(null);

    const loadAvailableStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminClassesService.getAvailableStudents(classItem.id, {
                search,
                per_page: 100,
            });
            if (response.success) {
                setAvailableStudents(response.data);
                // Get class requirements from response
                if ((response as any).class_requirements) {
                    setClassRequirements((response as any).class_requirements);
                }
            }
        } catch (error) {
            console.error('Error loading available students:', error);
            showNotification('error', 'Failed to load available students');
        } finally {
            setLoading(false);
        }
    }, [classItem.id, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAvailableStudents();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadAvailableStudents]);

    const toggleStudent = (studentId: number) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudents.size === availableStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(availableStudents.map(s => s.id)));
        }
    };

    const handleBulkEnroll = async () => {
        if (selectedStudents.size === 0) {
            showNotification('error', 'Please select at least one student to enroll');
            return;
        }

        setEnrolling(true);
        try {
            const response = await adminClassesService.bulkEnrollStudents(
                classItem.id,
                Array.from(selectedStudents)
            );
            
            if (response.success) {
                const { enrolled, failed, errors } = response.data;
                if (failed > 0) {
                    showNotification('success', `${enrolled} student(s) enrolled. ${failed} failed.`);
                } else {
                    showNotification('success', `${enrolled} student(s) enrolled successfully!`);
                }
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Failed to enroll students');
        } finally {
            setEnrolling(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Add Students to {classItem.class_code}
                                </h2>
                                <p className="text-white/80 text-sm mt-1">
                                    Select multiple students to enroll at once
                                </p>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-gray-50 border-b">
                        {/* Auto-filter Info */}
                        {classRequirements && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center text-sm text-blue-800">
                                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>
                                        Showing only <strong>{classRequirements.course_code}</strong> students in <strong>{formatGradeLevel(classRequirements.year_level)}</strong>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or ID..."
                                className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Selection Info */}
                    {selectedStudents.size > 0 && (
                        <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">
                                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={() => setSelectedStudents(new Set())}
                                className="text-sm text-green-600 hover:text-green-800"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}

                    {/* Student List */}
                    <div className="max-h-[50vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 text-green-600 animate-spin mb-2" />
                                <p className="text-gray-500">Loading available students...</p>
                            </div>
                        ) : availableStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-gray-500">No available students found</p>
                                <p className="text-gray-400 text-sm">All students may already be enrolled or try different filters</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={toggleAll}
                                                className="flex items-center text-xs font-bold text-gray-600 uppercase hover:text-gray-900"
                                            >
                                                {selectedStudents.size === availableStudents.length ? (
                                                    <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                                                ) : (
                                                    <Square className="h-4 w-4 mr-2" />
                                                )}
                                                Select All
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Program</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Year</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {availableStudents.map((student) => (
                                        <tr
                                            key={student.id}
                                            onClick={() => toggleStudent(student.id)}
                                            className={`cursor-pointer transition-colors ${
                                                selectedStudents.has(student.id)
                                                    ? 'bg-green-50 hover:bg-green-100'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {selectedStudents.has(student.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full ${selectedStudents.has(student.id) ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
                                                        <span className={`text-sm font-semibold ${selectedStudents.has(student.id) ? 'text-green-600' : 'text-gray-600'}`}>
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.student_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.program || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatGradeLevel(student.year_level)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            {availableStudents.length} student{availableStudents.length !== 1 ? 's' : ''} available
                        </span>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                disabled={enrolling}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkEnroll}
                                disabled={selectedStudents.size === 0 || enrolling}
                                className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                            >
                                {enrolling ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Enrolling...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Enroll {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''} Students
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏫 MAIN CLASSES PAGE
// ========================================================================

const Classes: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    // Student management modal states
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState<Class | null>(null);
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        program: '',
        year_level: '',
        page: 1,
        per_page: 10,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [stats, setStats] = useState<ClassStats>({
        total_classes: 0,
        total_students_enrolled: 0,
        total_advisers_assigned: 0,
        total_courses: 0,
        by_program: [],
    });

    useEffect(() => {
        loadClasses();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadClasses();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.program, filters.year_level, filters.page, filters.per_page]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const response: ClassesResponse = await adminClassesService.getClasses(filters);
            if (response.success) {
                setClasses(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            setNotification({ type: 'error', message: 'Failed to load class data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminClassesService.getClassStats();
            if (response.success) {
                setStats({
                    total_classes: response.data.total_classes || 0,
                    total_students_enrolled: response.data.total_students_enrolled || 0,
                    total_advisers_assigned: response.data.total_advisers_assigned || 0,
                    total_courses: response.data.total_courses || 0,
                    by_program: response.data.by_program || [],
                });
            }
        } catch (error) {
            console.error('Error loading class stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedClass(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (classItem: Class) => {
        setSelectedClass(classItem);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: ClassFormData) => {
        try {
            let response: ApiResponse<Class>;
            if (selectedClass) {
                response = await adminClassesService.updateClass(selectedClass.id, data);
                setNotification({ type: 'success', message: 'Class updated successfully!' });
            } else {
                response = await adminClassesService.createClass(data);
                setNotification({ type: 'success', message: 'Class created successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadClasses();
                loadStats();
                setValidationErrors({});
            }
        } catch (error: any) {
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
            setNotification({ type: 'error', message: error.message || 'Failed to save class' });
        }
    };

    const handleDelete = async (classItem: Class) => {
        const studentCount = classItem.student_count || 0;
        
        let confirmMessage = `Are you sure you want to delete class "${classItem.class_code} - ${classItem.class_name}"?`;
        if (studentCount > 0) {
            confirmMessage += `\n\n⚠️ Warning: This class has ${studentCount} enrolled student(s). Deleting will remove all enrollments.`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await adminClassesService.deleteClass(classItem.id);
            if (response.success) {
                setNotification({ type: 'success', message: `Class "${classItem.class_code}" deleted successfully!` });
                loadClasses();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete class' });
        }
    };

    // Student management handlers
    const handleViewStudents = (classItem: Class) => {
        setSelectedClassForStudents(classItem);
        setShowStudentsModal(true);
    };

    const handleOpenAddStudents = () => {
        setShowStudentsModal(false);
        setShowAddStudentsModal(true);
    };

    const handleStudentsUpdated = () => {
        loadClasses();
        loadStats();
    };

    const showNotificationHelper = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;
        return null; // Implement pagination UI as needed
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <LayoutGrid className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Class & Section Management</h1>
                                <p className="text-gray-600 mt-1">Organize student sections, assign advisers, and manage enrollment capacity</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Class
                            </button>
                            
                            <button 
                                onClick={() => loadClasses()}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Classes</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_classes}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <LayoutGrid className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Students Enrolled</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.total_students_enrolled}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Users className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Advisers Assigned</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.total_advisers_assigned}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <UserCheck className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Courses</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.total_courses}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <BookOpen className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Search code, name, or program..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    value={filters.program}
                                    onChange={(e) => setFilters({...filters, program: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Filter by Program..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <input
                                    type="number"
                                    value={filters.year_level}
                                    onChange={(e) => setFilters({...filters, year_level: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Filter by Grade Level..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Class Code & Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Program & Section</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Year</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Adviser</th> 
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mb-2`} />
                                                <p className="text-gray-500">Loading classes...</p>
                                            </div>
                                        </td></tr>
                                    ) : classes.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No classes found</td></tr>
                                    ) : (
                                        classes.map((classItem) => (
                                            <tr key={classItem.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{classItem.class_code}</div>
                                                    <div className="text-xs text-gray-500">{classItem.class_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{classItem.program}</div>
                                                    <div className="text-xs text-gray-500">Section {classItem.section}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatGradeLevel(classItem.year_level)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className='flex items-center text-sm text-gray-900'>
                                                        <UserCheck className='h-4 w-4 mr-2 text-gray-400' />
                                                        {classItem.adviser_name || 'Unassigned'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleViewStudents(classItem)}
                                                        className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-medium"
                                                        title="Click to view students"
                                                    >
                                                        {classItem.student_count || 0} {classItem.student_count === 1 ? 'student' : 'students'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewStudents(classItem)}
                                                            className={`p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors`}
                                                            title="View Students"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(classItem)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Class"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(classItem)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Class"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
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
                        <ClassModal
                            classItem={selectedClass}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {/* View Students Modal */}
                    {showStudentsModal && selectedClassForStudents && (
                        <ClassStudentsModal
                            classItem={selectedClassForStudents}
                            onClose={() => {
                                setShowStudentsModal(false);
                                setSelectedClassForStudents(null);
                            }}
                            onAddStudents={handleOpenAddStudents}
                            showNotification={showNotificationHelper}
                        />
                    )}

                    {/* Add Students Modal */}
                    {showAddStudentsModal && selectedClassForStudents && (
                        <AddStudentsModal
                            classItem={selectedClassForStudents}
                            onClose={() => {
                                setShowAddStudentsModal(false);
                                setShowStudentsModal(true); // Go back to students list
                            }}
                            onSuccess={handleStudentsUpdated}
                            showNotification={showNotificationHelper}
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

export default Classes;