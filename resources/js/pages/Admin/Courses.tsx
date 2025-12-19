import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminCourseService, 
    Course, 
    CourseFormData, 
    CourseStats 
} from '../../../services/AdminCourseService';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📋 INTERFACES 
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    level: string;
    is_active: string;
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

const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
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
// 📝 COURSE MODAL
// ========================================================================

const CourseModal: React.FC<{
    course: Course | null;
    onClose: () => void;
    onSave: (data: CourseFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ course, onClose, onSave, errors }) => {

    const [formData, setFormData] = useState<CourseFormData>({
        course_code: course?.course_code || '',
        course_name: course?.course_name || '',
        description: course?.description || '',
        level: course?.level || 'College',
        duration_years: course?.duration_years || 4,
        is_active: course?.is_active ?? true,
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'duration_years') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const levels = ['College', 'Senior High', 'Junior High', 'Elementary'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-4 sm:px-6 py-3 sm:py-4`}>
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                {course ? 'Edit Course/Program' : 'Create New Course/Program'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer flex-shrink-0">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Row 1: Course Code & Course Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Course Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="course_code"
                                    value={formData.course_code}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="e.g., BSMT"
                                    required
                                />
                                {errors.course_code && (<p className="text-red-500 text-xs mt-1">{errors.course_code[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="course_name"
                                    value={formData.course_name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="e.g., Bachelor of Science in Marine Transportation"
                                    required
                                />
                                {errors.course_name && (<p className="text-red-500 text-xs mt-1">{errors.course_name[0]}</p>)}
                            </div>
                        </div>
                        
                        {/* Row 2: Level, Duration, Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    {levels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                                {errors.level && (<p className="text-red-500 text-xs mt-1">{errors.level[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Duration (Years) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="duration_years"
                                    value={formData.duration_years}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    {[1, 2, 3, 4, 5, 6].map(year => (
                                        <option key={year} value={year}>{year} year{year > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                                {errors.duration_years && (<p className="text-red-500 text-xs mt-1">{errors.duration_years[0]}</p>)}
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="flex items-center h-[50px]">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all resize-none`}
                                placeholder="Brief description of the course/program..."
                            />
                            {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>)}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 border-t">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer" 
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className={`w-full sm:w-auto px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    course ? 'Update Course' : 'Create Course'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🎓 MAIN COURSES PAGE
// ========================================================================

const Courses: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        level: '',
        is_active: '',
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [stats, setStats] = useState<CourseStats>({
        total_courses: 0,
        active_courses: 0,
        by_level: [],
        total_students: 0,
    });

    const loadCourses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminCourseService.getCourses({
                ...filters,
                is_active: filters.is_active === '' ? undefined : filters.is_active === 'true',
            });
            if (response.success) {
                setCourses(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            setNotification({ type: 'error', message: 'Failed to load courses' });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadStats = async () => {
        try {
            const response = await adminCourseService.getCourseStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    useEffect(() => {
        loadCourses();
        loadStats();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCourses();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search, filters.level, filters.is_active, filters.page]);

    const handleAdd = () => {
        setSelectedCourse(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: CourseFormData) => {
        try {
            if (selectedCourse) {
                await adminCourseService.updateCourse(selectedCourse.id, data);
                setNotification({ type: 'success', message: 'Course updated successfully!' });
            } else {
                await adminCourseService.createCourse(data);
                setNotification({ type: 'success', message: 'Course created successfully!' });
            }
            
            setShowModal(false);
            loadCourses();
            loadStats();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save course' });
        }
    };

    const handleDelete = async (course: Course) => {
        if (!confirm(`Are you sure you want to delete "${course.course_code} - ${course.course_name}"?`)) {
            return;
        }

        try {
            await adminCourseService.deleteCourse(course.id);
            setNotification({ type: 'success', message: 'Course deleted successfully!' });
            loadCourses();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete course' });
        }
    };

    const getLevelBadgeColor = (level: string) => {
        const colors: Record<string, string> = {
            'College': 'bg-blue-100 text-blue-800',
            'Senior High': 'bg-purple-100 text-purple-800',
            'Junior High': 'bg-green-100 text-green-800',
            'Elementary': 'bg-yellow-100 text-yellow-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Course/Program Management</h1>
                                <p className="text-gray-600 mt-1">Manage academic programs and courses offered by the school</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Course
                            </button>
                            
                            <button 
                                onClick={() => loadCourses()}
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
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Courses</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_courses}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <GraduationCap className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Active Courses</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.active_courses}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.total_students}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Users className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">College Programs</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>
                                        {stats.by_level?.find(l => l.level === 'College')?.count || 0}
                                    </p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <BookOpen className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative md:col-span-2">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Search by code or name..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.level}
                                    onChange={(e) => setFilters({...filters, level: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">All Levels</option>
                                    <option value="College">College</option>
                                    <option value="Senior High">Senior High</option>
                                    <option value="Junior High">Junior High</option>
                                    <option value="Elementary">Elementary</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.is_active}
                                    onChange={(e) => setFilters({...filters, is_active: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Course Code</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Course Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mb-2`} />
                                                <p className="text-gray-500">Loading courses...</p>
                                            </div>
                                        </td></tr>
                                    ) : courses.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No courses found</td></tr>
                                    ) : (
                                        courses.map((course) => (
                                            <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{course.course_code}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                                                    {course.description && (
                                                        <div className="text-xs text-gray-500 truncate max-w-xs">{course.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getLevelBadgeColor(course.level)}`}>
                                                        {course.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {course.duration_years} year{course.duration_years > 1 ? 's' : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {course.is_active ? (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(course)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Course"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(course)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Course"
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
                        
                        {/* Pagination Info */}
                        {pagination.total > 0 && (
                            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Showing {courses.length} of {pagination.total} courses
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <CourseModal
                            course={selectedCourse}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {notification && (
                        <NotificationComponent
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Courses;

