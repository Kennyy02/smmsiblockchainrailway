import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Download, Phone, Mail, Link, Eye, EyeOff, UserPlus, GraduationCap, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
// UPDATED IMPORT: Using the new dedicated Parent service
import { adminParentService, Parent, ParentFormData, ParentStats, ParentsResponse, ApiResponse, StudentSelection } from '../../../services/AdminParentService';
import { adminStudentService, Student } from '../../../services/AdminStudentService';

// --- MARITIME THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]'; // Deep Navy Blue
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]'; // Darker Navy
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10'; // Light Blue/Navy Tint
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]'; // Very Light Blue

// Education levels for organizing parents by their children's level
const educationLevels = [
    { id: 'college', label: 'College', icon: '🎓', minGrade: 13, maxGrade: 16 },
    { id: 'senior_high', label: 'Senior High', icon: '📖', minGrade: 11, maxGrade: 12 },
    { id: 'junior_high', label: 'Junior High', icon: '📝', minGrade: 7, maxGrade: 10 },
    { id: 'elementary', label: 'Elementary', icon: '✏️', minGrade: 1, maxGrade: 6 },
];

// Get education level from year_level
const getEducationLevel = (yearLevel: number): string => {
    if (yearLevel >= 13) return 'college';
    if (yearLevel >= 11) return 'senior_high';
    if (yearLevel >= 7) return 'junior_high';
    return 'elementary';
};

// Helper function to format grade level
const formatGradeLevelModal = (yearLevel: number): string => {
    if (yearLevel >= 13) {
        const collegeYear = yearLevel - 12;
        const suffix = collegeYear === 1 ? 'st' : collegeYear === 2 ? 'nd' : collegeYear === 3 ? 'rd' : 'th';
        return `${collegeYear}${suffix} Year`;
    }
    return `Grade ${yearLevel}`;
};

// ========================================================================
// 搭 INTERFACE DEFINITIONS 
// NOTE: These interfaces are now imported from AdminParentService.ts
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    relationship: string;
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
// 耳 NOTIFICATION COMPONENT (Reused)
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
// 統 PARENT MODAL (For Add/Edit)
// ========================================================================

interface SelectedStudent {
    student_id: number;
    student_name: string;
    student_info: string;
    relationship: string;
}

const ParentModal: React.FC<{
    parent: Parent | null;
    onClose: () => void;
    onSave: (data: ParentFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ parent, onClose, onSave, errors }) => {
    
    const [formData, setFormData] = useState<ParentFormData>({
        user_id: parent?.user_id || 0, 
        first_name: parent?.first_name || '',
        last_name: parent?.last_name || '',
        middle_name: parent?.middle_name || '',
        email: parent?.email || '',
        phone: parent?.phone || '',
        address: parent?.address || '',
        password: '',
        password_confirmation: '',
        students: [],
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Check if passwords match in real-time
    const passwordsMatch = formData.password && formData.password_confirmation && 
                          formData.password === formData.password_confirmation;
    const passwordsDontMatch = formData.password_confirmation && 
                              formData.password !== formData.password_confirmation;
    
    // Student search state
    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Guardian', 'Grandparent', 'Other'];

    // Load existing linked students when editing
    useEffect(() => {
        if (parent && parent.students) {
            const existingStudents: SelectedStudent[] = parent.students.map((student: any) => ({
                student_id: student.id,
                student_name: student.full_name,
                student_info: `${student.program || 'N/A'} - ${formatGradeLevelModal(student.year_level)}`,
                relationship: student.pivot?.relationship || 'Parent',
            }));
            setSelectedStudents(existingStudents);
        }
    }, [parent]);

    // Search for students
    const searchStudents = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        
        setSearchLoading(true);
        try {
            const response = await adminStudentService.getStudents({ search: query, per_page: 10 });
            if (response.success) {
                const selectedIds = selectedStudents.map(s => s.student_id);
                const filtered = response.data.filter(s => !selectedIds.includes(s.id));
                setSearchResults(filtered);
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setSearchLoading(false);
        }
    }, [selectedStudents]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (studentSearch) {
                searchStudents(studentSearch);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [studentSearch, searchStudents]);

    const addStudent = (student: Student) => {
        const newStudent: SelectedStudent = {
            student_id: student.id,
            student_name: student.full_name,
            student_info: `${student.program || 'N/A'} - ${formatGradeLevelModal(student.year_level)}`,
            relationship: 'Father',
        };
        setSelectedStudents(prev => [...prev, newStudent]);
        setStudentSearch('');
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const removeStudent = (studentId: number) => {
        setSelectedStudents(prev => prev.filter(s => s.student_id !== studentId));
    };

    const updateRelationship = (studentId: number, relationship: string) => {
        setSelectedStudents(prev => prev.map(s => 
            s.student_id === studentId ? { ...s, relationship } : s
        ));
    };

    // Helper to format error messages for better UX
    const formatErrorMessage = (message: string): string => {
        // Remove "field_name: " prefix if it exists
        message = message.replace(/^[a-z_]+:\s*/i, '');
        
        return message
            .replace(/The password field confirmation does not match\./i, 'Passwords do not match')
            .replace(/The (.+?) field confirmation does not match\./i, '$1 confirmation does not match')
            .replace(/The (.+?) field must be at least (\d+) characters\./i, '$1 must be at least $2 characters')
            .replace(/The (.+?) has already been taken\./i, '$1 is already in use')
            .replace(/The (.+?) field is required\./i, '$1 is required')
            .replace(/The (.+?) must be at least (\d+) characters\./i, '$1 must be at least $2 characters');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: ParentFormData = {
            ...formData,
            students: selectedStudents.map(s => ({
                student_id: s.student_id,
                relationship: s.relationship,
            })),
            ...(formData.password ? { password: formData.password } : {}),
            ...(formData.password_confirmation ? { password_confirmation: formData.password_confirmation } : {}),
        };
        
        try {
            await onSave(payload);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4 sticky top-0 z-10`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {parent ? 'Edit Parent/Guardian' : 'Add New Parent/Guardian'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <input type="hidden" name="user_id" value={formData.user_id} />
                        
                        <div className="space-y-4">
                            {/* Parent/Guardian Information */}
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Parent/Guardian Information</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} required/>
                                    {errors.first_name && (<p className="text-red-500 text-xs mt-1">{errors.first_name[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} required/>
                                    {errors.last_name && (<p className="text-red-500 text-xs mt-1">{errors.last_name[0]}</p>)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} placeholder="parent@example.com" required/>
                                    {errors.email && (<p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} placeholder="+63 XXX XXX XXXX"/>
                                    {errors.phone && (<p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`} placeholder="Complete address"/>
                                {errors.address && (<p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>)}
                            </div>

                            <p className='text-sm text-gray-500'>{parent ? "Leave password fields empty to keep current password." : "Set a login password for the parent/guardian."}</p>
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
                                            required={!parent}
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
                                            required={!parent}
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

                            {/* Student/Child Link Section */}
                            <div className="pt-4">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Link to Student(s)/Child(ren)</h3>
                                
                                {/* Search Bar */}
                                <div className="relative mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search Student</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="Search by student name or ID..."
                                        />
                                        {searchLoading && (
                                            <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                                        )}
                                    </div>
                                    
                                    {/* Search Results Dropdown */}
                                    {showSearchResults && searchResults.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {searchResults.map((student) => (
                                                <button
                                                    key={student.id}
                                                    type="button"
                                                    onClick={() => addStudent(student)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex items-center">
                                                        <div className={`h-8 w-8 rounded-full ${LIGHT_BG_CLASS} flex items-center justify-center mr-3`}>
                                                            <GraduationCap className={`h-4 w-4 ${TEXT_COLOR_CLASS}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                                            <div className="text-xs text-gray-500">{student.student_id} • {student.program || 'N/A'} - {formatGradeLevelModal(student.year_level)}</div>
                                                        </div>
                                                    </div>
                                                    <UserPlus className="h-5 w-5 text-green-500" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {showSearchResults && studentSearch.length >= 2 && searchResults.length === 0 && !searchLoading && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                                            No students found matching "{studentSearch}"
                                        </div>
                                    )}
                                </div>

                                {/* Selected Students List */}
                                {selectedStudents.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Linked Students ({selectedStudents.length})</label>
                                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                                            {selectedStudents.map((student) => (
                                                <div key={student.student_id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                    <div className="flex items-center flex-1">
                                                        <div className={`h-8 w-8 rounded-full ${LIGHT_BG_CLASS} flex items-center justify-center mr-3`}>
                                                            <GraduationCap className={`h-4 w-4 ${TEXT_COLOR_CLASS}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                                                            <div className="text-xs text-gray-500">{student.student_info}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <select
                                                            value={student.relationship}
                                                            onChange={(e) => updateRelationship(student.student_id, e.target.value)}
                                                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white"
                                                        >
                                                            {RELATIONSHIP_OPTIONS.map(rel => (
                                                                <option key={rel} value={rel}>{rel}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStudent(student.student_id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove student"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedStudents.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                                        <Users className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-sm">No students linked yet</p>
                                        <p className="text-xs">Search and add students above</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : parent ? 'Update Guardian' : 'Add Guardian'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 卵ｸDELETE CONFIRMATION MODAL (Reused)
// ========================================================================

// ========================================================================
// 👁️ VIEW PARENT MODAL
// ========================================================================

const ViewParentModal: React.FC<{
    parent: Parent;
    onClose: () => void;
}> = ({ parent, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Parent/Guardian Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Header with Avatar */}
                        <div className="flex items-center mb-6 pb-6 border-b">
                            <div className={`${LIGHT_BG_CLASS} p-4 rounded-full mr-4`}>
                                <Users className={`h-12 w-12 ${TEXT_COLOR_CLASS}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{parent.full_name}</h3>
                                <p className="text-gray-500">{parent.guardian_id || 'Parent/Guardian'}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                                <p className="text-gray-900 font-medium mt-1">{parent.first_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                                <p className="text-gray-900 font-medium mt-1">{parent.last_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Middle Name</label>
                                <p className="text-gray-900 font-medium mt-1">{parent.middle_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Relationship</label>
                                <p className="text-gray-900 font-medium mt-1">{parent.relationship || 'Parent'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                                <p className="text-gray-900 font-medium mt-1 flex items-center">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    {parent.email}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                <p className="text-gray-900 font-medium mt-1 flex items-center">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    {parent.phone || '—'}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                                <p className="text-gray-900 font-medium mt-1">{parent.address || '—'}</p>
                            </div>
                        </div>

                        {/* Children Info */}
                        {parent.students && parent.students.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Children (Students)</h4>
                                <div className="space-y-2">
                                    {parent.students.map((student, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                                            <span className="font-medium text-gray-900">
                                                {student.first_name} {student.middle_name ? `${student.middle_name.charAt(0)}.` : ''} {student.last_name}
                                            </span>
                                            <span className="text-sm text-gray-500">{student.pivot?.relationship || 'Child'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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

const DeleteParentModal: React.FC<{
    parent: Parent;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}> = ({ parent, onClose, onConfirm }) => {
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
                        <h2 className="text-xl font-bold text-white">Delete Parent/Guardian</h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong className="text-gray-900">{parent.full_name}</strong>? This will unlink them from their associated students.
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
// 塘 MAIN PARENTS PAGE
// ========================================================================

const Parents: React.FC = () => {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        relationship: '',
        page: 1,
        per_page: 10,
    });

    // Education level tab filter - empty means no selection (list hidden)
    const [educationLevelFilter, setEducationLevelFilter] = useState<string>('');

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [stats, setStats] = useState<ParentStats>({
        total_parents: 0,
        verified_parents: 0,
        by_relationship: [],
    });

    useEffect(() => {
        loadStats();
        // Only load parents if an education level tab is selected
        if (educationLevelFilter) {
            loadParents();
        }
    }, []);

    useEffect(() => {
        // Only load if a tab is selected
        if (!educationLevelFilter) {
            setParents([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(() => {
            loadParents();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.page, filters.per_page, educationLevelFilter]);

    const loadParents = async () => {
        if (!educationLevelFilter) {
            setParents([]);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Map filter ID to education level name for API
            const educationLevelMap: Record<string, string> = {
                'college': 'College',
                'senior_high': 'Senior High',
                'junior_high': 'Junior High',
                'elementary': 'Elementary',
            };
            
            // Build API filter - include the education level filter
            const apiFilters = {
                ...filters,
                education_level: educationLevelMap[educationLevelFilter] || '',
            };
            
            // UPDATED CALL: Use adminParentService
            const response: ParentsResponse = await adminParentService.getParents(apiFilters);
            if (response.success) {
                setParents(response.data.map(p => ({
                    ...p,
                    // Map students_count from backend to children_count used in frontend UI
                    children_count: p.students_count || 0 
                })));
                if (response.pagination) {
                    setPagination(response.pagination);
                } else if (response.total) { 
                    setPagination(prev => ({ ...prev, total: response.total }));
                }
            }
        } catch (error) {
            console.error('Error loading parents:', error);
            setNotification({ type: 'error', message: 'Failed to load parent data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            // UPDATED CALL: Use adminParentService
            const response = await adminParentService.getParentStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading parent stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedParent(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (parent: Parent) => {
        setSelectedParent(parent);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleView = (parent: Parent) => {
        setSelectedParent(parent);
        setShowViewModal(true);
    };

    const handleSave = async (data: ParentFormData) => {
        try {
            let response: ApiResponse<Parent>;
            if (selectedParent) {
                // UPDATED CALL: Use adminParentService
                response = await adminParentService.updateParent(selectedParent.id, data);
                setNotification({ type: 'success', message: 'Parent/Guardian updated successfully!' });
            } else {
                // UPDATED CALL: Use adminParentService
                // Ensure user_id is set for the PHP backend validation.
                const createData = { ...data, user_id: 1 }; 
                response = await adminParentService.createParent(createData);
                setNotification({ type: 'success', message: 'Parent/Guardian added successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadParents();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save guardian details' });
        }
    };

    const handleDelete = (parent: Parent) => {
        setSelectedParent(parent);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedParent) return;

        try {
            // UPDATED CALL: Use adminParentService
            const response = await adminParentService.deleteParent(selectedParent.id);
            if (response.success) {
                setNotification({ type: 'success', message: 'Parent/Guardian deleted successfully!' });
                setShowDeleteModal(false);
                loadParents();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete guardian' });
        }
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
    };

    const getChildrenCountTag = (count: number) => {
        const color = count > 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700';
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
                {count} {count === 1 ? 'Child' : 'Children'}
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
                    Showing <span className="font-semibold">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> guardians
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
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Parent/Guardian Management</h1>
                                <p className="text-gray-600 mt-1">Manage contact and relationship details for student guardians</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Guardian
                            </button>
                            
                            <button 
                                onClick={() => loadParents()}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            
                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                                    title="Export Parents Report"
                                >
                                    <Download className="h-5 w-5" />
                                    <span className="text-sm font-medium">Export</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showExportDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                                            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Export Parents</p>
                                            {[
                                                { id: '', label: '👨‍👩‍👧 All Parents/Guardians' },
                                                { id: 'college', label: '🎓 College Only' },
                                                { id: 'senior_high', label: '📖 Senior High Only' },
                                                { id: 'junior_high', label: '📝 Junior High Only' },
                                                { id: 'elementary', label: '✏️ Elementary Only' },
                                            ].map(option => (
                                                <button
                                                    key={option.id || 'all'}
                                                    onClick={async () => {
                                                        setShowExportDropdown(false);
                                                        try {
                                                            setNotification({ type: 'success', message: 'Preparing export...' });
                                                            
                                                            // Fetch all parents
                                                            const response = await adminParentService.getParents(1, 9999, '', option.id || undefined);
                                                            
                                                            if (!response.success || !response.data) {
                                                                throw new Error('Failed to fetch parents');
                                                            }
                                                            
                                                            const exportParents = response.data;
                                                            
                                                            // Generate filename
                                                            const levelName = option.id ? option.id.replace('_', '-') : 'all';
                                                            const filename = `parents_${levelName}_${new Date().toISOString().split('T')[0]}.csv`;
                                                            
                                                            if (exportParents.length === 0) {
                                                                setNotification({ type: 'error', message: 'No parents found for this level' });
                                                                return;
                                                            }
                                                            
                                                            adminParentService.exportParentsToCSV(exportParents, filename);
                                                            setNotification({ type: 'success', message: `Exported ${exportParents.length} parents to CSV` });
                                                        } catch (error) {
                                                            console.error('Export error:', error);
                                                            setNotification({ type: 'error', message: 'Failed to export parents' });
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Parents/Guardians</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_parents}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Users className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Verified Accounts</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.verified_parents}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Link className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">With Linked Students</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>
                                        {stats.by_relationship?.reduce((sum, item) => sum + (item.count || 0), 0) || 0}
                                    </p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Link className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Education Level Tabs */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <p className="text-sm text-gray-600 mb-4">Select an education level to view parents/guardians:</p>
                        <div className="flex flex-wrap gap-3">
                            {educationLevels.map((level) => {
                                // Map level id to the format used in stats
                                const levelNameMap: Record<string, string> = {
                                    'college': 'College',
                                    'senior_high': 'Senior High',
                                    'junior_high': 'Junior High',
                                    'elementary': 'Elementary',
                                };
                                const count = stats.by_relationship?.find(
                                    r => r.level === levelNameMap[level.id] || r.relationship === levelNameMap[level.id]
                                )?.count || 0;
                                const isSelected = educationLevelFilter === level.id;
                                
                                return (
                                    <button
                                        key={level.id}
                                        onClick={() => {
                                            setEducationLevelFilter(isSelected ? '' : level.id);
                                            setFilters(prev => ({ ...prev, page: 1 }));
                                        }}
                                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                                            isSelected
                                                ? `${PRIMARY_COLOR_CLASS} text-white shadow-lg`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span>{level.icon}</span>
                                        <span>{level.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Show message if no tab selected */}
                    {!educationLevelFilter ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select an Education Level</h3>
                            <p className="text-gray-500">Click on one of the tabs above to view parents/guardians by their child's education level</p>
                        </div>
                    ) : (
                        <>
                            {/* Search and Filters */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                        className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        placeholder="Search guardian name or ID..."
                                    />
                                </div>
                            </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Parent/Guardian</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Info</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Children (Students)</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : parents.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                                                    <p className="text-lg font-medium">No parent/guardian accounts found</p>
                                                    <p className="text-sm">Add a new guardian or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        parents.map((parent) => (
                                            <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${LIGHT_BG_CLASS} flex items-center justify-center border border-[#003366]`}>
                                                            <Users className={`h-5 w-5 ${TEXT_COLOR_CLASS}`} />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {parent.full_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{parent.relationship_to_student || 'Parent'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                            {parent.email}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                            {parent.phone || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        {parent.students && parent.students.length > 0 ? (
                                                            parent.students.map((child: any) => (
                                                                <div key={child.id} className="flex items-center gap-2 text-sm">
                                                                    <span className="font-medium text-gray-900">{child.full_name}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                        child.year_level >= 13 ? 'bg-purple-100 text-purple-800' :
                                                                        child.year_level >= 11 ? 'bg-blue-100 text-blue-800' :
                                                                        child.year_level >= 7 ? 'bg-green-100 text-green-800' :
                                                                        'bg-orange-100 text-orange-800'
                                                                    }`}>
                                                                        {formatGradeLevelModal(child.year_level)}
                                                                    </span>
                                                                    {child.program && (
                                                                        <span className="text-xs text-gray-500">({child.program})</span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-gray-500">No linked students</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleView(parent)}
                                                            className={`p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors`}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(parent)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Guardian"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(parent)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Guardian"
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
                        </>
                    )}

                    {/* Modals */}
                    {showModal && (
                        <ParentModal
                            parent={selectedParent}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showViewModal && selectedParent && (
                        <ViewParentModal
                            parent={selectedParent}
                            onClose={() => setShowViewModal(false)}
                        />
                    )}

                    {showDeleteModal && selectedParent && (
                        <DeleteParentModal
                            parent={selectedParent}
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

export default Parents;
