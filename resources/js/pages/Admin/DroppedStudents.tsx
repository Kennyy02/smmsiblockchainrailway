import React, { useState, useEffect } from 'react';
import { User, Search, Filter, Edit, Trash2, X, RefreshCw, Download, Mail, BookOpen, Clock, Eye, EyeOff, GraduationCap, ChevronDown, ChevronRight, CheckCircle, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { adminStudentService, Student, StudentFormData, StudentStats, StudentsResponse, ApiResponse } from '../../../services/AdminStudentService';
import { adminCourseService, Course } from '../../../services/AdminCourseService'; 

// --- MARITIME THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

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

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    program: string;
    year_level: string;
    status: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const DroppedStudents: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showReEnrollModal, setShowReEnrollModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [reEnrollLoading, setReEnrollLoading] = useState(false);
    const [allDroppedStudents, setAllDroppedStudents] = useState<Student[]>([]);
    const [loadingAllStudents, setLoadingAllStudents] = useState(false);
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        program: '',
        year_level: '',
        status: '',
        page: 1,
        per_page: 10,
    });

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
        dropped_students: 0,
        by_course: [],
        by_education_level: {
            college: 0,
            senior_high: 0,
            junior_high: 0,
            elementary: 0,
        },
    });

    const [filterCourses, setFilterCourses] = useState<Course[]>([]);

    useEffect(() => {
        loadStudents();
        loadStats();
        loadFilterCourses();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadStudents();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.program, filters.year_level, filters.page, filters.per_page]);

    const loadFilterCourses = async () => {
        try {
            const response = await adminCourseService.getCourses();
            if (response.success) {
                setFilterCourses(response.data);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const apiFilters = {
                search: filters.search,
                program: filters.program,
                page: filters.page,
                per_page: 10,
                status: 'dropped', // Always filter for dropped students
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
            console.error('Error loading dropped students:', error);
            setNotification({ type: 'error', message: 'Failed to load dropped students' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminStudentService.getStudentStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleView = (student: Student) => {
        setSelectedStudent(student);
        setShowViewModal(true);
    };

    const handleDelete = (student: Student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedStudent) return;

        try {
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

    const loadAllDroppedStudents = async () => {
        setLoadingAllStudents(true);
        try {
            const response = await adminStudentService.getStudents({
                status: 'dropped',
                per_page: 1000, // Load all dropped students
            });
            if (response.success) {
                setAllDroppedStudents(response.data);
            }
        } catch (error) {
            console.error('Error loading all dropped students:', error);
        } finally {
            setLoadingAllStudents(false);
        }
    };

    const handleReEnroll = (student: Student) => {
        setSelectedStudent(student);
    };

    const handleOpenReEnrollModal = () => {
        setShowReEnrollModal(true);
        setSelectedStudent(null);
        loadAllDroppedStudents();
    };

    const handleConfirmReEnroll = async () => {
        if (!selectedStudent) return;

        setReEnrollLoading(true);
        try {
            const response = await adminStudentService.reEnrollStudent(selectedStudent.id);
            if (response.success) {
                setNotification({ type: 'success', message: `Student '${selectedStudent.full_name}' has been re-enrolled successfully!` });
                setShowReEnrollModal(false);
                setSelectedStudent(null);
                loadStudents();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to re-enroll student' });
        } finally {
            setReEnrollLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <button
                                onClick={() => router.visit('/admin/students')}
                                className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Back to Students"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div className={`bg-red-600 p-3 rounded-xl mr-4`}>
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dropped Students</h1>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage all dropped students</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleOpenReEnrollModal}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Re-Enroll Student
                            </button>
                            <button 
                                onClick={() => loadStudents()}
                                className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-4 md:p-5 border border-red-100 dark:border-red-900">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 mb-1">Dropped Students</p>
                                    <p className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-400">{stats.dropped_students ?? 0}</p>
                                </div>
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 md:p-3 rounded-lg sm:rounded-xl">
                                    <User className="h-6 w-6 md:h-7 md:w-7 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Search student name or ID..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filters.program}
                                    onChange={(e) => setFilters({ ...filters, program: e.target.value, page: 1 })}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Courses</option>
                                    {filterCourses.map(course => (
                                        <option key={course.id} value={course.course_code}>{course.course_code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STUDENT & ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PARENT/GUARDIAN</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">LEVEL</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PROGRAM</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GRADE</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400">Loading dropped students...</p>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No dropped students found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <User className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.full_name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {student.parents && student.parents.length > 0 ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.parents[0].full_name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.parents[0].pivot?.relationship || 'Parent'}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">No parent linked</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                                        {student.year_level >= 13 ? 'College' : student.year_level >= 11 ? 'Senior High' : student.year_level >= 7 ? 'Junior High' : 'Elementary'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {student.program || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {formatGradeLevel(student.year_level)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                                                        Dropped
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleView(student)}
                                                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(student)}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete Student"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                        {pagination.last_page > 1 && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing <span className="font-semibold">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to{' '}
                                    <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                                    <span className="font-semibold">{pagination.total}</span> students
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Modal */}
                    {showViewModal && selectedStudent && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowViewModal(false)}></div>
                                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
                                    <div className="bg-red-600 px-6 py-4 rounded-t-2xl">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-white">Student Details</h2>
                                            <button onClick={() => setShowViewModal(false)} className="text-white/80 hover:text-white">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Student ID</label>
                                                <p className="text-gray-900 font-medium mt-1">{selectedStudent.student_id}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                                                <p className="text-gray-900 font-medium mt-1">{selectedStudent.full_name}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                                <p className="text-gray-900 font-medium mt-1">{selectedStudent.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Program</label>
                                                <p className="text-gray-900 font-medium mt-1">{selectedStudent.program || '—'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Grade Level</label>
                                                <p className="text-gray-900 font-medium mt-1">{formatGradeLevel(selectedStudent.year_level)}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                                <p className="mt-1">
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Dropped</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-6 pt-6 border-t">
                                            <button
                                                onClick={() => setShowViewModal(false)}
                                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Re-Enroll Modal */}
                    {showReEnrollModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
                                    setShowReEnrollModal(false);
                                    setSelectedStudent(null);
                                }}></div>
                                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl">
                                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4 rounded-t-2xl`}>
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-white">Re-Enroll Student</h2>
                                            <button
                                                onClick={() => {
                                                    setShowReEnrollModal(false);
                                                    setSelectedStudent(null);
                                                }}
                                                className="text-white/80 hover:text-white"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        {selectedStudent ? (
                                            // Confirmation view
                                            <div>
                                                <div className="flex items-center mb-4">
                                                    <button
                                                        onClick={() => setSelectedStudent(null)}
                                                        className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        disabled={reEnrollLoading}
                                                    >
                                                        <ArrowLeft className="h-5 w-5" />
                                                    </button>
                                                    <h3 className="text-lg font-semibold text-gray-900">Confirm Re-Enrollment</h3>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                                    <div className="flex items-center mb-3">
                                                        <User className="h-10 w-10 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="font-medium text-gray-900">{selectedStudent.full_name}</div>
                                                            <div className="text-sm text-gray-500">{selectedStudent.student_id}</div>
                                                            {selectedStudent.program && (
                                                                <div className="text-xs text-gray-400 mt-1">{selectedStudent.program} • {formatGradeLevel(selectedStudent.year_level)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 mb-6">
                                                    Are you sure you want to re-enroll this student? This will change their status from <strong className="text-orange-600">dropped</strong> to <strong className="text-green-600">active</strong>.
                                                </p>
                                                <div className="flex justify-end space-x-3">
                                                    <button
                                                        onClick={() => setSelectedStudent(null)}
                                                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                                        disabled={reEnrollLoading}
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowReEnrollModal(false);
                                                            setSelectedStudent(null);
                                                        }}
                                                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                                        disabled={reEnrollLoading}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleConfirmReEnroll}
                                                        disabled={reEnrollLoading}
                                                        className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`}
                                                    >
                                                        {reEnrollLoading ? 'Re-enrolling...' : 'Re-Enroll Student'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Student selection view
                                            <div>
                                                <p className="text-gray-600 mb-4">Select a student to re-enroll:</p>
                                                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                                    {loadingAllStudents ? (
                                                        <div className="p-8 text-center">
                                                            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                                                            <p className="text-gray-500">Loading students...</p>
                                                        </div>
                                                    ) : allDroppedStudents.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-gray-500 font-medium">No dropped students found</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-200">
                                                            {allDroppedStudents.map((student) => (
                                                                <button
                                                                    key={student.id}
                                                                    onClick={() => handleReEnroll(student)}
                                                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center flex-1">
                                                                            <User className="h-8 w-8 text-gray-400 mr-3" />
                                                                            <div>
                                                                                <div className="font-medium text-gray-900">{student.full_name}</div>
                                                                                <div className="text-sm text-gray-500">{student.student_id}</div>
                                                                                {student.program && (
                                                                                    <div className="text-xs text-gray-400 mt-1">{student.program} • {formatGradeLevel(student.year_level)}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Modal */}
                    {showDeleteModal && selectedStudent && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                                    <div className="bg-red-600 px-6 py-4 rounded-t-2xl">
                                        <h2 className="text-xl font-bold text-white">Delete Student</h2>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to permanently delete student <strong className="text-gray-900">{selectedStudent.full_name} ({selectedStudent.student_id})</strong>? This action cannot be undone and will permanently remove the student from the database.
                                        </p>
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmDelete}
                                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg"
                                            >
                                                Delete Student
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification */}
                    {notification && (
                        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        } text-white`}>
                            <div className="flex items-center justify-between">
                                <span>{notification.message}</span>
                                <button onClick={() => setNotification(null)} className="ml-4">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default DroppedStudents;

