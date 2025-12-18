import React, { useState, useEffect } from 'react';
import { User, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Download, Mail, BookOpen, Clock, Eye, EyeOff, GraduationCap, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
// UPDATED IMPORT: Use the new specific service
import { adminStudentService, Student, StudentFormData, StudentStats, StudentsResponse, ApiResponse, ParentGuardianFormData } from '../../../services/AdminStudentService';
import { adminCourseService, Course } from '../../../services/AdminCourseService'; 

// --- MARITIME THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]'; // Deep Navy Blue
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]'; // Darker Navy
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10'; // Light Blue/Navy Tint
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]'; // Very Light Blue

// Format date display
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch {
        return dateString;
    }
};

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

// Get education level from year_level
const getEducationLevel = (yearLevel: number): string => {
    if (yearLevel >= 13) return 'College';
    if (yearLevel >= 11) return 'Senior High';
    if (yearLevel >= 7) return 'Junior High';
    return 'Elementary';
};

// Get education level badge color
const getEducationLevelColor = (level: string): string => {
    switch (level) {
        case 'College': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Senior High': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Junior High': return 'bg-green-100 text-green-800 border-green-200';
        case 'Elementary': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

// Education levels for tabs (no "All Levels" - must select one)
const educationLevels = [
    { id: 'college', label: 'College', icon: '🎓', minGrade: 13, maxGrade: 16 },
    { id: 'senior_high', label: 'Senior High', icon: '📖', minGrade: 11, maxGrade: 12 },
    { id: 'junior_high', label: 'Junior High', icon: '📝', minGrade: 7, maxGrade: 10 },
    { id: 'elementary', label: 'Elementary', icon: '✏️', minGrade: 1, maxGrade: 6 },
];



interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    program: string; 
    year_level: string;
    status: string; // 'active', 'inactive', or '' for all
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
// 耳 NOTIFICATION COMPONENT
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
// 統 STUDENT MODAL (For Add/Edit)
// ========================================================================

const StudentModal: React.FC<{
    student: Student | null;
    onClose: () => void;
    onSave: (data: StudentFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ student, onClose, onSave, errors }) => {

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Date input expects YYYY-MM-DD format
        return date.toISOString().split('T')[0]; 
    };

    // Helper to format error messages for better UX
    const formatErrorMessage = (message: string): string => {
        // Remove "field_name: " prefix if it exists
        message = message.replace(/^[a-z_]+:\s*/i, '');
        
        return message
            .replace(/The password field confirmation does not match\./i, 'Passwords do not match')
            .replace(/The parent guardian\.password field confirmation does not match\./i, 'Parent passwords do not match')
            .replace(/The (.+?) field confirmation does not match\./i, '$1 confirmation does not match')
            .replace(/The (.+?) field must be at least (\d+) characters\./i, '$1 must be at least $2 characters')
            .replace(/The (.+?) has already been taken\./i, '$1 is already in use')
            .replace(/The (.+?) field is required\./i, '$1 is required')
            .replace(/The (.+?) must be at least (\d+) characters\./i, '$1 must be at least $2 characters');
    };

    const existingParent = student?.parents?.[0];
    
    const [formData, setFormData] = useState<StudentFormData>({
        student_id: student?.student_id || '',
        first_name: student?.first_name || '',
        last_name: student?.last_name || '',
        middle_name: student?.middle_name || '',
        email: student?.email || '',
        gender: student?.gender || '',
        phone: student?.phone || '',
        address: student?.address || '',
        program: student?.program || '',
        year_level: student?.year_level || 1,
        date_of_birth: formatDate(student?.date_of_birth), 
        password: '',
        password_confirmation: '',
        parent_guardian: {
            first_name: existingParent?.first_name || '',
            middle_name: existingParent?.middle_name || '',
            last_name: existingParent?.last_name || '',
            email: existingParent?.email || '',
            gender: existingParent?.gender || '',
            phone: existingParent?.phone || '',
            address: existingParent?.address || '',
            relationship: existingParent?.relationship || 'Parent',
            password: '',
            password_confirmation: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showParentPassword, setShowParentPassword] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    
    // Check if passwords match in real-time
    const passwordsMatch = formData.password && formData.password_confirmation && 
                          formData.password === formData.password_confirmation;
    const passwordsDontMatch = formData.password_confirmation && 
                              formData.password !== formData.password_confirmation;
    
    const parentPasswordsMatch = formData.parent_guardian?.password && 
                                formData.parent_guardian?.password_confirmation && 
                                formData.parent_guardian.password === formData.parent_guardian.password_confirmation;
    const parentPasswordsDontMatch = formData.parent_guardian?.password_confirmation && 
                                    formData.parent_guardian?.password !== formData.parent_guardian?.password_confirmation;

    // Load courses on mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const response = await adminCourseService.getActiveCourses();
                if (response.success) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.error('Error loading courses:', error);
            } finally {
                setLoadingCourses(false);
            }
        };
        loadCourses();
    }, []);

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
        
        // If grade level changes and it doesn't require a course, clear the program
        if (name === 'year_level') {
            const grade = parseInt(value);
            setFormData(prev => ({ 
                ...prev, 
                year_level: grade,
                program: requiresCourse(grade) ? prev.program : '' // Clear program if Elementary or Junior High
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: type === 'number' ? parseInt(value) || 0 : value 
            }));
        }
    };
    
    const handleParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            parent_guardian: {
                ...prev.parent_guardian!,
                [name]: value,
            },
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {student ? 'Edit Student' : 'Add New Student'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
                                    <input
                                        type="text"
                                        name="student_id"
                                        value={formData.student_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        placeholder="e.g., SMMS-2023001"
                                        required
                                    />
                                    {errors.student_id && (<p className="text-red-500 text-xs mt-1">{errors.student_id[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        placeholder="student@example.com"
                                        required
                                    />
                                    {errors.email && (<p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>)}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {errors.gender && (<p className="text-red-500 text-xs mt-1">{errors.gender[0]}</p>)}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} required/>
                                    {errors.first_name && (<p className="text-red-500 text-xs mt-1">{errors.first_name[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                                    <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} required/>
                                    {errors.last_name && (<p className="text-red-500 text-xs mt-1">{errors.last_name[0]}</p>)}
                                </div>
                            </div>
                            
                            <div className={`grid ${requiresCourse(formData.year_level) ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Grade Level <span className="text-red-500">*</span></label>
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
                                    {errors.year_level && (<p className="text-red-500 text-xs mt-1">{errors.year_level[0]}</p>)}
                                </div>
                                {requiresCourse(formData.year_level) && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Course/Program <span className="text-red-500">*</span></label>
                                        <select 
                                            name="program" 
                                            value={formData.program} 
                                            onChange={handleChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                            required
                                            disabled={loadingCourses}
                                        >
                                            <option value="">Select Course/Program</option>
                                            {courses.filter(c => {
                                                // Filter courses based on selected grade level
                                                if (formData.year_level >= 13) return c.level === 'College';
                                                if (formData.year_level >= 11) return c.level === 'Senior High';
                                                return false;
                                            }).map(course => (
                                                <option key={course.id} value={course.course_code}>
                                                    {course.course_code} - {course.course_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.program && (<p className="text-red-500 text-xs mt-1">{errors.program[0]}</p>)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} placeholder="+63 XXX XXX XXXX"/>
                                    {errors.phone && (<p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        name="date_of_birth" 
                                        value={formData.date_of_birth} 
                                        onChange={handleChange} 
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} 
                                        required
                                    />
                                    {errors.date_of_birth && (<p className="text-red-500 text-xs mt-1">{errors.date_of_birth[0]}</p>)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    value={formData.address || ''} 
                                    onChange={handleChange} 
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Complete address"
                                />
                                {errors.address && (<p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>)}
                            </div>

                            <p className='text-sm text-gray-500 pt-2'>{student ? "Leave password fields empty to keep current password." : "Set an initial password for the student."}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12`}
                                            required={!student}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 text-sm font-medium">{formatErrorMessage(errors.password[0])}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12`}
                                            required={!student}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    
                                    {/* Real-time password match feedback */}
                                    {passwordsDontMatch && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                            <p className="text-red-600 text-sm font-medium">Passwords do not match</p>
                                        </div>
                                    )}
                                    {passwordsMatch && (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            <p className="text-green-600 text-sm font-medium">Passwords match</p>
                                        </div>
                                    )}
                                    
                                    {/* Server-side validation errors */}
                                    {errors.password_confirmation && !passwordsMatch && !passwordsDontMatch && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 text-sm font-medium">{formatErrorMessage(errors.password_confirmation[0])}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                                                        {/* Parent/Guardian Section */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Parent/Guardian Information
                                </h3>
                                
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                                        <select 
                                            name="relationship" 
                                            value={formData.parent_guardian?.relationship || 'Parent'} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                        >
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Guardian">Guardian</option>
                                            <option value="Parent">Parent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                        <input 
                                            type="text" 
                                            name="first_name" 
                                            value={formData.parent_guardian?.first_name || ''} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="First name"
                                        />
                                        {errors['parent_guardian.first_name'] && (<p className="text-red-500 text-xs mt-1">{errors['parent_guardian.first_name'][0]}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                                        <input 
                                            type="text" 
                                            name="middle_name" 
                                            value={formData.parent_guardian?.middle_name || ''} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="Middle name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                        <input 
                                            type="text" 
                                            name="last_name" 
                                            value={formData.parent_guardian?.last_name || ''} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="Last name"
                                        />
                                        {errors['parent_guardian.last_name'] && (<p className="text-red-500 text-xs mt-1">{errors['parent_guardian.last_name'][0]}</p>)}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={formData.parent_guardian?.email || ''} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="parent@example.com"
                                        />
                                        {errors['parent_guardian.email'] && (<p className="text-red-500 text-xs mt-1">{errors['parent_guardian.email'][0]}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.parent_guardian?.gender || ''}
                                            onChange={handleParentChange}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        {errors['parent_guardian.gender'] && (<p className="text-red-500 text-xs mt-1">{errors['parent_guardian.gender'][0]}</p>)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                        <input 
                                            type="text" 
                                            name="phone" 
                                            value={formData.parent_guardian?.phone || ''} 
                                            onChange={handleParentChange} 
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="+63 XXX XXX XXXX"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                    <input 
                                        type="text" 
                                        name="address" 
                                        value={formData.parent_guardian?.address || ''} 
                                        onChange={handleParentChange} 
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        placeholder="Complete address"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showParentPassword ? "text" : "password"}
                                                name="password" 
                                                value={formData.parent_guardian?.password || ''} 
                                                onChange={handleParentChange} 
                                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12`}
                                                placeholder="Parent login password"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowParentPassword(prev => !prev)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showParentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors['parent_guardian.password'] && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-600 text-sm font-medium">{formatErrorMessage(errors['parent_guardian.password'][0])}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showParentPassword ? "text" : "password"}
                                                name="password_confirmation" 
                                                value={formData.parent_guardian?.password_confirmation || ''} 
                                                onChange={handleParentChange} 
                                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12`}
                                                placeholder="Confirm password"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowParentPassword(prev => !prev)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showParentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        
                                        {/* Real-time password match feedback for parent */}
                                        {parentPasswordsDontMatch && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                                <p className="text-red-600 text-sm font-medium">Passwords do not match</p>
                                            </div>
                                        )}
                                        {parentPasswordsMatch && (
                                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <p className="text-green-600 text-sm font-medium">Passwords match</p>
                                            </div>
                                        )}
                                        
                                        {/* Server-side validation errors */}
                                        {errors['parent_guardian.password_confirmation'] && !parentPasswordsMatch && !parentPasswordsDontMatch && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-600 text-sm font-medium">{formatErrorMessage(errors['parent_guardian.password_confirmation'][0])}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Optional: Fill in parent/guardian details to link them to this student. Password is required if creating a parent account.</p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 卵ｸDELETE CONFIRMATION MODAL (Reused)
// ========================================================================

// ========================================================================
// 👁️ VIEW STUDENT MODAL
// ========================================================================

const ViewStudentModal: React.FC<{
    student: Student;
    onClose: () => void;
    formatGradeLevel: (yearLevel: number, courseLevel?: string) => string;
}> = ({ student, onClose, formatGradeLevel }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Student Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex items-center mb-6 pb-6 border-b">
                            <div className={`${LIGHT_BG_CLASS} p-4 rounded-full mr-4`}>
                                <User className={`h-12 w-12 ${TEXT_COLOR_CLASS}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {student.first_name} {student.middle_name ? `${student.middle_name.charAt(0)}.` : ''} {student.last_name}
                                </h3>
                                <p className="text-gray-500">{student.student_id}</p>
                            </div>
                            <div className="ml-auto">
                                {student.current_class_id ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">ACTIVE</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">INACTIVE</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                                <p className="text-gray-900 font-medium mt-1">{student.first_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                                <p className="text-gray-900 font-medium mt-1">{student.last_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Middle Name</label>
                                <p className="text-gray-900 font-medium mt-1">{student.middle_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student ID</label>
                                <p className="text-gray-900 font-medium mt-1">{student.student_id}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                                <p className="text-gray-900 font-medium mt-1 flex items-center">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    {student.email}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                                <p className="text-gray-900 font-medium mt-1">{student.gender || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Program/Course</label>
                                <p className="text-gray-900 font-medium mt-1">{student.course?.code || student.program || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade Level</label>
                                <p className="text-gray-900 font-medium mt-1">{formatGradeLevel(student.year_level, student.course?.level)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</label>
                                <p className="text-gray-900 font-medium mt-1">{student.section || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment Date</label>
                                <p className="text-gray-900 font-medium mt-1">{formatDate(student.enrollment_date)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                                <p className="text-gray-900 font-medium mt-1">{student.address || '—'}</p>
                            </div>
                        </div>

                        {student.parents && student.parents.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Parent/Guardian Information</h4>
                                <div className="space-y-2">
                                    {student.parents.map((parent, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                                            <span className="font-medium text-gray-900">{parent.full_name}</span>
                                            <span className="text-sm text-gray-500">{parent.pivot?.relationship || 'Parent'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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

const DeleteStudentModal: React.FC<{
    student: Student;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}> = ({ student, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <h2 className="text-xl font-bold text-white">Delete Student</h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete student <strong className="text-gray-900">{student.full_name} ({student.student_id})</strong>? This action will archive their data.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg disabled:opacity-50" disabled={loading}>
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 塘 MAIN STUDENTS PAGE
// ========================================================================

const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        program: '', 
        year_level: '',
        status: '', // 'active', 'inactive', or '' for all
        page: 1,
        per_page: 10,
    });

    // Education level tab filter
    const [educationLevelFilter, setEducationLevelFilter] = useState<string>('');
    
    // Export dropdown state
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [stats, setStats] = useState<StudentStats>({
        total_students: 0,
        active_students: 0,
        inactive_students: 0,
        by_course: [],
        by_education_level: {
            college: 0,
            senior_high: 0,
            junior_high: 0,
            elementary: 0,
        },
    });

    // Courses for filter dropdown
    const [filterCourses, setFilterCourses] = useState<Course[]>([]);

    useEffect(() => {
        loadStudents();
        loadFilterCourses();
    }, []);

    const loadFilterCourses = async () => {
        try {
            const response = await adminCourseService.getActiveCourses();
            if (response.success) {
                setFilterCourses(response.data);
            }
        } catch (error) {
            console.error('Error loading courses for filter:', error);
        }
    };

    useEffect(() => {
        // Only load if education level is selected
        if (!educationLevelFilter) {
            setStudents([]);
            setLoading(false);
            return;
        }
        
        const delayDebounceFn = setTimeout(() => {
            loadStudents();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.program, filters.status, filters.page, filters.per_page, educationLevelFilter]);

    const loadStudents = async () => {
        if (!educationLevelFilter) {
            setStudents([]);
            return;
        }
        
        setLoading(true);
        try {
            // Map education level to year_level range for API
            const yearLevelRanges: Record<string, { min: number; max: number }> = {
                'college': { min: 13, max: 16 },
                'senior_high': { min: 11, max: 12 },
                'junior_high': { min: 7, max: 10 },
                'elementary': { min: 1, max: 6 },
            };
            
            const range = yearLevelRanges[educationLevelFilter];
            
            const apiFilters = {
                search: filters.search,
                program: filters.program,
                page: filters.page,
                per_page: 10,
                year_level_min: range?.min,
                year_level_max: range?.max,
                status: filters.status, // 'active' or 'inactive'
            };
            const response = await adminStudentService.getStudents(apiFilters);
            if (response.success) {
                setStudents(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                } else if (response.total) { 
                    setPagination(prev => ({ ...prev, total: response.total }));
                }
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setNotification({ type: 'error', message: 'Failed to load students' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // UPDATED CALL: Use adminStudentService
            const response = await adminStudentService.getStudentStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedStudent(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleView = (student: Student) => {
        setSelectedStudent(student);
        setShowViewModal(true);
    };

    const handleSave = async (data: StudentFormData) => {
        try {
            let response;
            if (selectedStudent) {
                // UPDATED CALL: Use adminStudentService
                response = await adminStudentService.updateStudent(selectedStudent.id, data);
                setNotification({ type: 'success', message: 'Student updated successfully!' });
            } else {
                // UPDATED CALL: Use adminStudentService
                response = await adminStudentService.createStudent(data);
                setNotification({ type: 'success', message: 'Student added successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadStudents();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save student' });
        }
    };

    const handleDelete = (student: Student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedStudent) return;

        try {
            // UPDATED CALL: Use adminStudentService
            const response = await adminStudentService.deleteStudent(selectedStudent.id);
            if (response.success) {
                setNotification({ type: 'success', message: 'Student deleted successfully!' });
                setShowDeleteModal(false);
                loadStudents();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete student' });
        }
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
    };

    const getActiveStatusTag = (classId: number | null) => {
        if (classId) {
            return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-800`}>
                    Active
                </span>
            );
        }
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase bg-gray-100 text-gray-600`}>
                Inactive
            </span>
        );
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;
        
        const pages = [];
        const maxPages = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxPages / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxPages - 1);
        
        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button 
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-4 py-2 mx-1 rounded-lg font-medium transition-all ${
                        i === pagination.current_page ? 
                        `${PRIMARY_COLOR_CLASS} text-white shadow-lg` : 
                        `bg-white text-gray-700 ${LIGHT_HOVER_CLASS} border border-gray-300`
                    }`}
                >
                    {i}
                </button>
            );
        }
        
        return (
            <div className="flex justify-between items-center mt-6 px-6">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> students
                </p>
                <div className="flex justify-center items-center space-x-2">
                    <button 
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className={`px-4 py-2 rounded-lg bg-white text-gray-700 ${LIGHT_HOVER_CLASS} border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium`}
                    >
                        Previous
                    </button>
                    
                    {pages}
                    
                    <button 
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-4 py-2 rounded-lg bg-white text-gray-700 ${LIGHT_HOVER_CLASS} border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };


    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                                <p className="text-gray-600 mt-1">Manage student enrollment, details, and academic status</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Enroll Student
                            </button>
                            
                            <button 
                                onClick={() => loadStudents()}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                                    title="Download Students Report"
                                >
                                    <Download className="h-5 w-5" />
                                    <span className="text-sm font-medium">Export</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {/* Export Dropdown Menu */}
                                {showExportDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowExportDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                                            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Export Students</p>
                                            {[
                                                { id: '', label: '📚 All Students', icon: '📚' },
                                                { id: 'college', label: '🎓 College Only', icon: '🎓' },
                                                { id: 'senior_high', label: '📖 Senior High Only', icon: '📖' },
                                                { id: 'junior_high', label: '📝 Junior High Only', icon: '📝' },
                                                { id: 'elementary', label: '✏️ Elementary Only', icon: '✏️' },
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={async () => {
                                                        setShowExportDropdown(false);
                                                        try {
                                                            setNotification({ type: 'success', message: 'Preparing export...' });
                                                            
                                                            // Fetch ALL students (no pagination limit)
                                                            const response = await adminStudentService.getStudents({
                                                                per_page: 9999, // Get all students
                                                            });
                                                            
                                                            if (!response.success) {
                                                                throw new Error('Failed to fetch students');
                                                            }
                                                            
                                                            let exportStudents = response.data;
                                                            
                                                            // Filter by selected education level
                                                            if (option.id) {
                                                                exportStudents = exportStudents.filter(s => {
                                                                    const level = getEducationLevel(s.year_level);
                                                                    return level.toLowerCase().replace(' ', '_') === option.id;
                                                                });
                                                            }
                                                            
                                                            // Generate filename
                                                            const levelName = option.id ? option.id.replace('_', '-') : 'all';
                                                            const filename = `students_${levelName}_${new Date().toISOString().split('T')[0]}.csv`;
                                                            
                                                            if (exportStudents.length === 0) {
                                                                setNotification({ type: 'error', message: 'No students found for this level' });
                                                                return;
                                                            }
                                                            
                                                            adminStudentService.exportStudentsToCSV(exportStudents, filename);
                                                            setNotification({ type: 'success', message: `Exported ${exportStudents.length} students to CSV` });
                                                        } catch (error) {
                                                            console.error('Export error:', error);
                                                            setNotification({ type: 'error', message: 'Failed to export students' });
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <span>{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - Total, Active, Inactive */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_students}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <User className={`h-7 w-7 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-5 border border-green-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600 mb-1">Total Active</p>
                                    <p className="text-3xl font-bold text-green-700">{stats.active_students}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <User className="h-7 w-7 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-5 border border-red-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600 mb-1">Total Inactive</p>
                                    <p className="text-3xl font-bold text-red-700">{stats.inactive_students}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-xl">
                                    <User className="h-7 w-7 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Education Level Tabs */}
                    <div className="bg-white rounded-2xl shadow-lg p-3 mb-6 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-3 px-2">Select an education level to view students:</p>
                        <div className="flex flex-wrap gap-2">
                            {educationLevels.map((level) => {
                                // Get count from stats (all students in DB, not just paginated)
                                const levelCount = stats.by_education_level?.[level.id as keyof typeof stats.by_education_level] || 0;
                                
                                return (
                                    <button
                                        key={level.id}
                                        onClick={() => {
                                            setEducationLevelFilter(level.id);
                                            setFilters(prev => ({ ...prev, year_level: '', page: 1 }));
                                        }}
                                        className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all ${
                                            educationLevelFilter === level.id
                                                ? `${PRIMARY_COLOR_CLASS} text-white shadow-lg scale-105`
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                                        }`}
                                    >
                                        <span className="mr-2 text-lg">{level.icon}</span>
                                        <span>{level.label}</span>
                                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                            educationLevelFilter === level.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {levelCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Show content only when a level is selected */}
                    {!educationLevelFilter ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
                            <div className="flex flex-col items-center">
                                <div className={`${LIGHT_BG_CLASS} p-6 rounded-full mb-6`}>
                                    <GraduationCap className={`h-16 w-16 ${TEXT_COLOR_CLASS}`} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Education Level</h3>
                                <p className="text-gray-500 max-w-md">
                                    Choose College, Senior High, Junior High, or Elementary from the tabs above to view and manage students in that level.
                                </p>
                            </div>
                        </div>
                    ) : (
                    <>
                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className={`grid grid-cols-1 ${(educationLevelFilter === 'college' || educationLevelFilter === 'senior_high') ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Search student name or ID..."
                                />
                            </div>
                            {/* Program filter - only show for College and Senior High */}
                            {(educationLevelFilter === 'college' || educationLevelFilter === 'senior_high') && (
                                <div className="flex items-center">
                                    <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                    <select
                                        name="program"
                                        value={filters.program} 
                                        onChange={(e) => setFilters({...filters, program: e.target.value, page: 1})} 
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white`}
                                    >
                                        <option value="">All {educationLevelFilter === 'college' ? 'Courses' : 'Programs'}</option>
                                        {filterCourses
                                            .filter(course => {
                                                if (educationLevelFilter === 'college') return course.level === 'College';
                                                if (educationLevelFilter === 'senior_high') return course.level === 'Senior High';
                                                return false;
                                            })
                                            .map((course) => (
                                                <option key={course.id} value={course.course_code}>{course.course_code} - {course.course_name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}
                            {/* Status filter - Active/Inactive */}
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white`}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active (Enrolled)</option>
                                    <option value="inactive">Inactive (Not Enrolled)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student & ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Parent/Guardian</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Program</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th> 
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <User className="h-12 w-12 text-gray-300 mb-4" />
                                                    <p className="text-lg font-medium">No students found</p>
                                                    <p className="text-sm">Try adjusting your search or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => {
                                            const eduLevel = getEducationLevel(student.year_level);
                                            const primaryParent = student.parents && student.parents.length > 0 ? student.parents[0] : null;
                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${LIGHT_BG_CLASS} flex items-center justify-center border border-[#003366]`}>
                                                                <User className={`h-5 w-5 ${TEXT_COLOR_CLASS}`} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {student.full_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{student.student_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {primaryParent ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{primaryParent.full_name}</div>
                                                                <div className="text-xs text-gray-500">{primaryParent.pivot?.relationship || 'Parent'}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEducationLevelColor(eduLevel)}`}>
                                                            {eduLevel}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{student.program || '-'}</div> 
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">{formatGradeLevel(student.year_level)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getActiveStatusTag(student.current_class_id)} 
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleView(student)}
                                                                className={`p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors`}
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(student)}
                                                                className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                                title="Edit Student"
                                                            >
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(student)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Student"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {renderPagination()}
                    </div>
                    </>
                    )}

                    {/* Modals */}
                    {showModal && (
                        <StudentModal
                            student={selectedStudent}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showViewModal && selectedStudent && (
                        <ViewStudentModal
                            student={selectedStudent}
                            onClose={() => setShowViewModal(false)}
                            formatGradeLevel={formatGradeLevel}
                        />
                    )}

                    {showDeleteModal && selectedStudent && (
                        <DeleteStudentModal
                            student={selectedStudent}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={handleConfirmDelete}
                        />
                    )}

                    {/* Notification */}
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

export default Students;