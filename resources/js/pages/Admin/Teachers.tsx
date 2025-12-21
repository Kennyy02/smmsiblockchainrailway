import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, X, RefreshCw, Download, Phone, Mail, Users, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
// UPDATED IMPORT: Changed from adminService to adminTeacherService
import { adminTeacherService, Teacher, TeacherFormData } from '../../../services/AdminTeacherService'; 

const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

interface NotificationData {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total_teachers: number;
}

const NotificationBanner: React.FC<{ notification: NotificationData; onClose: () => void }> = ({ notification, onClose }) => {
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

const TeacherModal: React.FC<{
    teacher: Teacher | null;
    onClose: () => void;
    onSave: (data: TeacherFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ teacher, onClose, onSave, errors }) => {
    const [formData, setFormData] = useState<TeacherFormData>({
        teacher_id: teacher?.teacher_id || '',
        first_name: teacher?.first_name || '',
        last_name: teacher?.last_name || '',
        middle_name: teacher?.middle_name || '',
        email: teacher?.email || '',
        gender: teacher?.gender || '',
        phone: teacher?.phone || '',
        address: teacher?.address || '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Check if passwords match in real-time
    const passwordsMatch = formData.password && formData.password_confirmation && 
                          formData.password === formData.password_confirmation;
    const passwordsDontMatch = formData.password_confirmation && 
                              formData.password !== formData.password_confirmation;

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
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

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {teacher ? 'Edit Teacher' : 'Add New Teacher'}
                            </h2>
                            <button 
                                onClick={onClose} 
                                className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 dark:bg-gray-800">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Teacher ID</label>
                                <input
                                    type="text"
                                    name="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    placeholder="e.g., TCH-001"
                                    required
                                />
                                {errors.teacher_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.teacher_id[0]}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        required
                                    />
                                    {errors.first_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.first_name[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Middle Name</label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        required
                                    />
                                    {errors.last_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.last_name[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        placeholder="teacher@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {errors.gender && (
                                        <p className="text-red-500 text-xs mt-1">{errors.gender[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        placeholder="+63 XXX XXX XXXX"
                                    />
                                    {errors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    placeholder="Complete address"
                                />
                                {errors.address && (
                                    <p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>
                                )}
                            </div>

                            <p className='text-sm text-gray-500 dark:text-gray-400 pt-2'>{teacher ? "Leave password fields empty to keep current password." : "Set a new password for the teacher."}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                            required={!teacher}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                                        >
                                            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{formatErrorMessage(errors.password[0])}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                            required={!teacher}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                                        >
                                            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    
                                    {/* Real-time password match feedback */}
                                    {passwordsDontMatch && (
                                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">Passwords do not match</p>
                                        </div>
                                    )}
                                    {passwordsMatch && (
                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Passwords match</p>
                                        </div>
                                    )}
                                    
                                    {/* Server-side validation errors */}
                                    {errors.password_confirmation && !passwordsMatch && !passwordsDontMatch && (
                                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{formatErrorMessage(errors.password_confirmation[0])}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : teacher ? 'Update Teacher' : 'Add Teacher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW TEACHER MODAL
// ========================================================================

const ViewTeacherModal: React.FC<{
    teacher: Teacher;
    onClose: () => void;
}> = ({ teacher, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Teacher Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 dark:bg-gray-800">
                        {/* Header with Avatar */}
                        <div className="flex items-center mb-6 pb-6 border-b dark:border-gray-700">
                            <div className={`${LIGHT_BG_CLASS} p-4 rounded-full mr-4`}>
                                <UserCheck className={`h-12 w-12 ${TEXT_COLOR_CLASS}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{teacher.teacher_id}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">First Name</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.first_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Name</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.last_name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Middle Name</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.middle_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher ID</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.teacher_id}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1 flex items-center">
                                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                    {teacher.email}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.gender || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1 flex items-center">
                                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                    {teacher.phone || '—'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.address || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Advisory Class</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1">{teacher.advisory_class_name || '—'}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end mt-6 pt-6 border-t dark:border-gray-700">
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

const DeleteModal: React.FC<{
    teacher: Teacher;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}> = ({ teacher, onClose, onConfirm }) => {
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
                
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <h2 className="text-xl font-bold text-white">Delete Teacher</h2>
                    </div>
                    
                    <div className="p-6 dark:bg-gray-800">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}</strong>? This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Teachers: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        page: 1,
        per_page: 10,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total_teachers: 0,
    });

    const [stats, setStats] = useState({
        total_teachers: 0,
        by_department: [] as { department: string; count: number }[],
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadTeachers();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.page, filters.per_page]);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            // UPDATED CALL: Use adminTeacherService
            const response = await adminTeacherService.getTeachers(filters);
            if (response.success) {
                setTeachers(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
            setNotification({ type: 'error', message: 'Failed to load teachers' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // UPDATED CALL: Use adminTeacherService
            const response = await adminTeacherService.getTeacherStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedTeacher(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleView = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setShowViewModal(true);
    };

    const handleSave = async (data: TeacherFormData) => {
        try {
            if (selectedTeacher) {
                // UPDATED CALL: Use adminTeacherService
                const response = await adminTeacherService.updateTeacher(selectedTeacher.id, data);
                if (response.success) {
                    setNotification({ type: 'success', message: 'Teacher updated successfully!' });
                    setShowModal(false);
                    loadTeachers();
                    loadStats();
                }
            } else {
                // UPDATED CALL: Use adminTeacherService
                const response = await adminTeacherService.createTeacher(data);
                if (response.success) {
                    setNotification({ type: 'success', message: 'Teacher added successfully!' });
                    setShowModal(false);
                    loadTeachers();
                    loadStats();
                }
            }
            setValidationErrors({});
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
            setNotification({ type: 'error', message: error.message || 'Failed to save teacher' });
        }
    };

    const handleDelete = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTeacher) return;

        try {
            // UPDATED CALL: Use adminTeacherService
            const response = await adminTeacherService.deleteTeacher(selectedTeacher.id);
            if (response.success) {
                setNotification({ type: 'success', message: 'Teacher deleted successfully!' });
                setShowDeleteModal(false);
                loadTeachers();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete teacher' });
        }
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
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
                        `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${LIGHT_HOVER_CLASS} dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600`
                    }`}
                >
                    {i}
                </button>
            );
        }
        
        return (
            <div className="flex justify-center items-center mt-6 space-x-2">
                <button 
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className={`px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${LIGHT_HOVER_CLASS} dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium`}
                >
                    Previous
                </button>
                
                {pages}
                
                <button 
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className={`px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${LIGHT_HOVER_CLASS} dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium`}
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <UserCheck className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Management</h1>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">Manage teacher accounts and information for the Southern Mindoro Maritime School</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Teacher
                            </button>
                            
                            <button 
                                onClick={() => loadTeachers()}
                                className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            
                            {/* Export Button */}
                            <button
                                onClick={() => {
                                    const filename = `teachers_report_${new Date().toISOString().split('T')[0]}.csv`;
                                    adminTeacherService.exportTeachersToCSV(teachers, filename);
                                    setNotification({ type: 'success', message: `Exported ${teachers.length} teachers to CSV` });
                                }}
                                className="inline-flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                                title="Export Teachers to CSV/Excel"
                            >
                                <Download className="h-5 w-5" />
                                <span className="text-sm font-medium">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Compact on Mobile */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">Total</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{stats.total_teachers}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                                    <Users className={`h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">Advisers</p>
                                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${TEXT_COLOR_CLASS} leading-tight`}>
                                        {teachers.filter(t => t.advisory_class_name).length}
                                    </p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                                    <UserCheck className={`h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search - Compact on Mobile */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                placeholder="Search teachers..."
                            />
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Teacher & Actions, Desktop shows all columns */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Teacher</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Contact</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Advisory Class</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : teachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <UserCheck className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No teachers found</p>
                                                    <p className="text-xs sm:text-sm">Try adjusting your search or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        teachers.map((teacher) => (
                                            <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center">
                                                        <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full ${PRIMARY_COLOR_CLASS} flex items-center justify-center shadow-lg`}>
                                                            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                                        </div>
                                                        <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                                                            <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{teacher.teacher_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        <div className="flex items-center text-xs sm:text-sm text-gray-900 dark:text-white">
                                                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                                            <span className="truncate">{teacher.email}</span>
                                                        </div>
                                                        {teacher.phone && (
                                                            <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                                                <span className="truncate">{teacher.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                                    {teacher.advisory_class_name || <span className="text-gray-400 dark:text-gray-500">—</span>}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleView(teacher)}
                                                            className={`p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors`}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(teacher)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Teacher"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(teacher)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Teacher"
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

                    {showModal && (
                        <TeacherModal
                            teacher={selectedTeacher}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showViewModal && selectedTeacher && (
                        <ViewTeacherModal
                            teacher={selectedTeacher}
                            onClose={() => setShowViewModal(false)}
                        />
                    )}

                    {showDeleteModal && selectedTeacher && (
                        <DeleteModal
                            teacher={selectedTeacher}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={handleConfirmDelete}
                        />
                    )}

                    {notification && (
                        <NotificationBanner
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Teachers;