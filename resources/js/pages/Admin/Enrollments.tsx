import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Users, BookOpen, Plus, Search, RefreshCw, X, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PrintButton from '@/components/PrintButton';
import { adminClassesService, AcademicYear, Semester, Class } from '../../../services/AdminClassesService';
import { adminStudentService } from '../../../services/AdminStudentService';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

type TabId = 'class' | 'subject';

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// Class enrollment (student-in-class)
interface ClassEnrollment {
    id: number;
    student_id: number;
    class_id: number;
    academic_year_id: number;
    semester_id: number;
    enrollment_date: string;
    status: string;
    student?: { id: number; student_id: string; first_name: string; last_name: string; full_name?: string; email?: string };
    class?: Class & { class_code?: string; class_name?: string; section?: string };
    academic_year?: { id: number; year_name: string };
    semester?: { id: number; semester_name: string };
}

// Student subject enrollment
interface StudentSubjectEnrollmentRow {
    id: number;
    student_id: number;
    course_year_subject_id: number;
    academic_year_id: number;
    semester_id: number;
    class_subject_id: number | null;
    status: string;
    is_retake: boolean;
    enrolled_at: string;
    student?: { id: number; student_id: string; first_name: string; last_name: string; full_name?: string };
    course_year_subject?: {
        id: number;
        subject?: { subject_code: string; subject_name: string };
        course?: { course_code: string; course_name: string };
        is_required?: boolean;
    };
    academic_year?: { id: number; year_name: string };
    semester?: { id: number; semester_name: string };
    class_subject?: { id: number; class?: { class_code?: string } } | null;
}

// Available subject for enrollment (from availableSubjects API)
interface AvailableSubject {
    id: number;
    subject_code: string;
    subject_name: string;
    is_required: boolean;
    units?: number;
    already_enrolled: boolean;
    allow_retake: boolean;
    allow_new: boolean;
    can_enroll: boolean;
}

interface StudentOption {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    year_level?: number;
    course_id?: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(dateString);
    }
};

const NotificationComp: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${notification.type === 'success' ? PRIMARY_COLOR_CLASS : 'bg-gradient-to-r from-red-500 to-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20"><X className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

async function getCsrfToken(): Promise<string> {
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (meta) return meta;
    const res = await fetch('/api/csrf-token', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const data = await res.json();
    return data?.csrf_token || '';
}

async function apiGet<T>(url: string): Promise<{ success: boolean; data?: T; pagination?: Pagination; message?: string }> {
    const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data?.message || 'Request failed' };
    return data;
}

async function apiPost<T>(url: string, body: object): Promise<{ success: boolean; data?: T; message?: string }> {
    const token = await getCsrfToken();
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data?.message || 'Request failed' };
    return data;
}

export default function Enrollments() {
    const [activeTab, setActiveTab] = useState<TabId>('class');
    const [notification, setNotification] = useState<Notification | null>(null);

    // Class enrollments
    const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);
    const [classPagination, setClassPagination] = useState<Pagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
    const [classFilters, setClassFilters] = useState({ academic_year_id: '', semester_id: '', class_id: '', student_id: '', status: '', search: '', page: 1, per_page: 15 });
    const [classLoading, setClassLoading] = useState(false);

    // Subject enrollments
    const [subjectEnrollments, setSubjectEnrollments] = useState<StudentSubjectEnrollmentRow[]>([]);
    const [subjectPagination, setSubjectPagination] = useState<Pagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
    const [subjectFilters, setSubjectFilters] = useState({ academic_year_id: '', semester_id: '', class_id: '', student_id: '', status: '', search: '', page: 1, per_page: 15 });
    const [subjectLoading, setSubjectLoading] = useState(false);

    // Dropdowns
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<StudentOption[]>([]);

    // Enroll-in-subjects modal
    const [showEnrollSubjectsModal, setShowEnrollSubjectsModal] = useState(false);
    const [enrollStudentId, setEnrollStudentId] = useState<number | ''>('');
    const [enrollAcademicYearId, setEnrollAcademicYearId] = useState<number | ''>('');
    const [enrollSemesterId, setEnrollSemesterId] = useState<number | ''>('');
    const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
    const [enrollSelectedIds, setEnrollSelectedIds] = useState<number[]>([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollSubmitLoading, setEnrollSubmitLoading] = useState(false);
    const [enrollStudentInfo, setEnrollStudentInfo] = useState<{ full_name?: string; is_irregular?: boolean } | null>(null);

    const loadDropdowns = useCallback(async () => {
        try {
            const [ayRes, semRes, classRes, stuRes] = await Promise.all([
                adminClassesService.getAcademicYears(),
                adminClassesService.getSemesters(),
                adminClassesService.getClasses({ per_page: 500 }),
                adminStudentService.getStudents({ per_page: 500 }),
            ]);
            if (ayRes.success && ayRes.data) setAcademicYears(ayRes.data);
            if (semRes.success && semRes.data) setSemesters(semRes.data);
            if (classRes.success && classRes.data) setClasses(classRes.data);
            if (stuRes.success && stuRes.data) setStudents(stuRes.data);
        } catch (e) {
            console.error(e);
            setNotification({ type: 'error', message: 'Failed to load dropdowns' });
        }
    }, []);

    useEffect(() => {
        loadDropdowns();
    }, [loadDropdowns]);

    const loadClassEnrollments = useCallback(async () => {
        setClassLoading(true);
        try {
            const params = new URLSearchParams();
            if (classFilters.academic_year_id) params.set('academic_year_id', classFilters.academic_year_id);
            if (classFilters.semester_id) params.set('semester_id', classFilters.semester_id);
            if (classFilters.class_id) params.set('class_id', classFilters.class_id);
            if (classFilters.student_id) params.set('student_id', classFilters.student_id);
            if (classFilters.status) params.set('status', classFilters.status);
            if (classFilters.search) params.set('search', classFilters.search);
            params.set('page', String(classFilters.page));
            params.set('per_page', String(classFilters.per_page));
            const res = await apiGet<ClassEnrollment[]>(`/api/enrollments?${params.toString()}`);
            if (res.success && res.data) {
                setClassEnrollments(res.data);
                if (res.pagination) setClassPagination(res.pagination);
            } else {
                setNotification({ type: 'error', message: res.message || 'Failed to load class enrollments' });
            }
        } catch (e) {
            setNotification({ type: 'error', message: 'Failed to load class enrollments' });
        } finally {
            setClassLoading(false);
        }
    }, [classFilters]);

    const loadSubjectEnrollments = useCallback(async () => {
        setSubjectLoading(true);
        try {
            const params = new URLSearchParams();
            if (subjectFilters.academic_year_id) params.set('academic_year_id', subjectFilters.academic_year_id);
            if (subjectFilters.semester_id) params.set('semester_id', subjectFilters.semester_id);
            if (subjectFilters.class_id) params.set('class_id', subjectFilters.class_id);
            if (subjectFilters.student_id) params.set('student_id', subjectFilters.student_id);
            if (subjectFilters.status) params.set('status', subjectFilters.status);
            if (subjectFilters.search) params.set('search', subjectFilters.search);
            params.set('page', String(subjectFilters.page));
            params.set('per_page', String(subjectFilters.per_page));
            const res = await apiGet<StudentSubjectEnrollmentRow[]>(`/api/student-subject-enrollments?${params.toString()}`);
            if (res.success && res.data) {
                setSubjectEnrollments(res.data);
                if (res.pagination) setSubjectPagination(res.pagination);
            } else {
                setNotification({ type: 'error', message: res.message || 'Failed to load subject enrollments' });
            }
        } catch (e) {
            setNotification({ type: 'error', message: 'Failed to load subject enrollments' });
        } finally {
            setSubjectLoading(false);
        }
    }, [subjectFilters]);

    useEffect(() => {
        if (activeTab === 'class') loadClassEnrollments();
    }, [activeTab, loadClassEnrollments]);

    useEffect(() => {
        if (activeTab === 'subject') loadSubjectEnrollments();
    }, [activeTab, loadSubjectEnrollments]);

    const loadAvailableSubjects = useCallback(async () => {
        if (!enrollStudentId || !enrollAcademicYearId || !enrollSemesterId) {
            setAvailableSubjects([]);
            setEnrollStudentInfo(null);
            return;
        }
        setEnrollLoading(true);
        try {
            const params = new URLSearchParams({
                student_id: String(enrollStudentId),
                academic_year_id: String(enrollAcademicYearId),
                semester_id: String(enrollSemesterId),
            });
            const res = await apiGet<AvailableSubject[]>(`/api/student-subject-enrollments/available-subjects?${params.toString()}`);
            const fullRes = res as { success: boolean; data?: AvailableSubject[]; student?: { full_name?: string; is_irregular?: boolean }; message?: string };
            if (fullRes.success && fullRes.data) {
                setAvailableSubjects(fullRes.data);
                setEnrollSelectedIds([]);
            }
            if (fullRes.student) setEnrollStudentInfo({ full_name: fullRes.student.full_name, is_irregular: fullRes.student.is_irregular });
            else setEnrollStudentInfo(null);
        } catch (e) {
            setAvailableSubjects([]);
            setEnrollStudentInfo(null);
        } finally {
            setEnrollLoading(false);
        }
    }, [enrollStudentId, enrollAcademicYearId, enrollSemesterId]);

    useEffect(() => {
        loadAvailableSubjects();
    }, [loadAvailableSubjects]);

    const openEnrollSubjectsModal = () => {
        setEnrollStudentId('');
        setEnrollAcademicYearId('');
        setEnrollSemesterId('');
        setAvailableSubjects([]);
        setEnrollSelectedIds([]);
        setEnrollStudentInfo(null);
        setShowEnrollSubjectsModal(true);
    };

    const toggleEnrollSubject = (cysId: number) => {
        setEnrollSelectedIds(prev => prev.includes(cysId) ? prev.filter(id => id !== cysId) : [...prev, cysId]);
    };

    const submitEnrollSubjects = async () => {
        if (!enrollStudentId || !enrollAcademicYearId || !enrollSemesterId || enrollSelectedIds.length === 0) {
            setNotification({ type: 'error', message: 'Select a student, term, and at least one subject.' });
            return;
        }
        setEnrollSubmitLoading(true);
        try {
            const res = await apiPost<{ created: number; errors?: string[] }>('/api/student-subject-enrollments', {
                student_id: enrollStudentId,
                academic_year_id: enrollAcademicYearId,
                semester_id: enrollSemesterId,
                course_year_subject_ids: enrollSelectedIds,
            });
            if (res.success) {
                const msg = res.data?.errors?.length ? `${res.data.created} enrolled. ${res.data.errors.join(' ')}` : (res.message || `${res.data?.created ?? 0} subject(s) enrolled.`);
                setNotification({ type: 'success', message: msg });
                setShowEnrollSubjectsModal(false);
                if (activeTab === 'subject') loadSubjectEnrollments();
            } else {
                setNotification({ type: 'error', message: res.message || 'Enrollment failed' });
            }
        } catch (e) {
            setNotification({ type: 'error', message: 'Enrollment failed' });
        } finally {
            setEnrollSubmitLoading(false);
        }
    };

    const canEnrollList = availableSubjects.filter(s => s.can_enroll);
    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            enrolled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            incomplete: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
            completed: 'bg-green-100 text-green-800',
            withdrawn: 'bg-gray-100 text-gray-800',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Enrollments</h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">Class enrollments and subject enrollments per student</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => activeTab === 'class' ? loadClassEnrollments() : loadSubjectEnrollments()}
                                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${(activeTab === 'class' ? classLoading : subjectLoading) ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            {activeTab === 'subject' && (
                                <button
                                    onClick={openEnrollSubjectsModal}
                                    className={`inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium text-xs sm:text-sm`}
                                >
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                    Enroll student in subjects
                                </button>
                            )}
                            <PrintButton className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
                        <button
                            onClick={() => setActiveTab('class')}
                            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'class' ? `${PRIMARY_COLOR_CLASS} text-white` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <Users className="h-4 w-4" /> Class Enrollments
                        </button>
                        <button
                            onClick={() => setActiveTab('subject')}
                            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'subject' ? `${PRIMARY_COLOR_CLASS} text-white` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <BookOpen className="h-4 w-4" /> Subject Enrollments
                        </button>
                    </div>

                    {/* Class Enrollments Tab */}
                    {activeTab === 'class' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none">
                            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-end">
                                <select
                                    value={classFilters.academic_year_id}
                                    onChange={e => setClassFilters(f => ({ ...f, academic_year_id: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All years</option>
                                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.year_name}</option>)}
                                </select>
                                <select
                                    value={classFilters.semester_id}
                                    onChange={e => setClassFilters(f => ({ ...f, semester_id: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All semesters</option>
                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                                </select>
                                <select
                                    value={classFilters.class_id}
                                    onChange={e => setClassFilters(f => ({ ...f, class_id: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All classes</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_code || c.class_name || `Class ${c.id}`}</option>)}
                                </select>
                                <select
                                    value={classFilters.status}
                                    onChange={e => setClassFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All statuses</option>
                                    <option value="enrolled">Enrolled</option>
                                    <option value="completed">Completed</option>
                                    <option value="dropped">Dropped</option>
                                    <option value="withdrawn">Withdrawn</option>
                                </select>
                                <div className="flex-1 min-w-[120px] flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                                    <Search className="h-4 w-4 text-gray-400 ml-2" />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        value={classFilters.search}
                                        onChange={e => setClassFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                                        className="flex-1 py-1.5 px-2 text-sm text-gray-900 dark:text-gray-100 bg-transparent border-0 focus:ring-0"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {classLoading ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Student</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Class</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Academic Year</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Semester</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {classEnrollments.length === 0 ? (
                                                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No class enrollments found.</td></tr>
                                            ) : (
                                                classEnrollments.map(row => (
                                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {row.student?.full_name || `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim() || row.student_id}
                                                            {row.student?.student_id && <span className="text-gray-500 dark:text-gray-400 ml-1">({row.student.student_id})</span>}
                                                        </td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-900 dark:text-gray-100">{row.class?.class_code || row.class?.class_name || row.class_id}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300">{row.academic_year?.year_name || row.academic_year_id}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300">{row.semester?.semester_name || row.semester_id}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(row.enrollment_date)}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(row.status)}`}>{row.status}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {classPagination.last_page > 1 && (
                                <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Page {classPagination.current_page} of {classPagination.last_page} ({classPagination.total} total)</span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={classPagination.current_page <= 1}
                                            onClick={() => setClassFilters(f => ({ ...f, page: f.page - 1 }))}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        >Previous</button>
                                        <button
                                            disabled={classPagination.current_page >= classPagination.last_page}
                                            onClick={() => setClassFilters(f => ({ ...f, page: f.page + 1 }))}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        >Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subject Enrollments Tab */}
                    {activeTab === 'subject' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none">
                            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-end">
                                <select
                                    value={subjectFilters.academic_year_id}
                                    onChange={e => setSubjectFilters(f => ({ ...f, academic_year_id: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All years</option>
                                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.year_name}</option>)}
                                </select>
                                <select
                                    value={subjectFilters.semester_id}
                                    onChange={e => setSubjectFilters(f => ({ ...f, semester_id: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All semesters</option>
                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                                </select>
                                <select
                                    value={subjectFilters.status}
                                    onChange={e => setSubjectFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 px-2"
                                >
                                    <option value="">All statuses</option>
                                    <option value="enrolled">Enrolled</option>
                                    <option value="passed">Passed</option>
                                    <option value="failed">Failed</option>
                                    <option value="dropped">Dropped</option>
                                    <option value="incomplete">Incomplete</option>
                                </select>
                                <div className="flex-1 min-w-[120px] flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                                    <Search className="h-4 w-4 text-gray-400 ml-2" />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        value={subjectFilters.search}
                                        onChange={e => setSubjectFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                                        className="flex-1 py-1.5 px-2 text-sm text-gray-900 dark:text-gray-100 bg-transparent border-0 focus:ring-0"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {subjectLoading ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Student</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Subject</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Course</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Year / Semester</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Retake</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {subjectEnrollments.length === 0 ? (
                                                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No subject enrollments found.</td></tr>
                                            ) : (
                                                subjectEnrollments.map(row => (
                                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {row.student?.full_name || `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim() || row.student_id}
                                                            {row.student?.student_id && <span className="text-gray-500 dark:text-gray-400 ml-1">({row.student.student_id})</span>}
                                                        </td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {row.course_year_subject?.subject?.subject_code} {row.course_year_subject?.subject?.subject_name}
                                                            {row.course_year_subject?.is_required && <span className="text-amber-600 dark:text-amber-400 text-xs ml-1">(Req)</span>}
                                                        </td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300">{row.course_year_subject?.course?.course_code || row.course_year_subject?.course?.course_name || '—'}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300">{row.academic_year?.year_name} / {row.semester?.semester_name}</td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(row.status)}`}>{row.status}</span>
                                                        </td>
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm">{row.is_retake ? <span className="text-amber-600 dark:text-amber-400 font-medium">Yes</span> : '—'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {subjectPagination.last_page > 1 && (
                                <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Page {subjectPagination.current_page} of {subjectPagination.last_page} ({subjectPagination.total} total)</span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={subjectPagination.current_page <= 1}
                                            onClick={() => setSubjectFilters(f => ({ ...f, page: f.page - 1 }))}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        >Previous</button>
                                        <button
                                            disabled={subjectPagination.current_page >= subjectPagination.last_page}
                                            onClick={() => setSubjectFilters(f => ({ ...f, page: f.page + 1 }))}
                                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        >Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enroll student in subjects modal */}
                    {showEnrollSubjectsModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEnrollSubjectsModal(false)} />
                            <div className="relative min-h-screen flex items-center justify-center p-4">
                                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                                    <div className={`${PRIMARY_COLOR_CLASS} px-4 py-3 sm:px-6 rounded-t-xl`}>
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-white">Enroll student in subjects</h2>
                                            <button onClick={() => setShowEnrollSubjectsModal(false)} className="p-1 rounded-lg text-white/80 hover:bg-white/20"><X className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Select student and term, then choose subjects from the curriculum (required/optional). Retakes are allowed for failed required subjects.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                                                <select
                                                    value={enrollStudentId}
                                                    onChange={e => setEnrollStudentId(e.target.value ? Number(e.target.value) : '')}
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-2 px-3"
                                                >
                                                    <option value="">Select student</option>
                                                    {students.map(s => (
                                                        <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.student_id})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Academic year</label>
                                                <select
                                                    value={enrollAcademicYearId}
                                                    onChange={e => setEnrollAcademicYearId(e.target.value ? Number(e.target.value) : '')}
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-2 px-3"
                                                >
                                                    <option value="">Select year</option>
                                                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.year_name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                                                <select
                                                    value={enrollSemesterId}
                                                    onChange={e => setEnrollSemesterId(e.target.value ? Number(e.target.value) : '')}
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-2 px-3"
                                                >
                                                    <option value="">Select semester</option>
                                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {enrollStudentInfo?.is_irregular && (
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
                                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                <span>Student has a failed required subject; only retake of that subject is allowed until passed.</span>
                                            </div>
                                        )}
                                        {enrollLoading ? (
                                            <div className="py-4 text-center text-gray-500 dark:text-gray-400">Loading available subjects...</div>
                                        ) : canEnrollList.length === 0 && (enrollStudentId && enrollAcademicYearId && enrollSemesterId) ? (
                                            <div className="py-4 text-center text-gray-500 dark:text-gray-400">No subjects available to enroll (already enrolled or no curriculum for this term).</div>
                                        ) : canEnrollList.length > 0 ? (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Subjects (check to enroll)</label>
                                                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                                                    {canEnrollList.map(s => (
                                                        <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={enrollSelectedIds.includes(s.id)}
                                                                onChange={() => toggleEnrollSubject(s.id)}
                                                                className="rounded border-gray-300 dark:border-gray-600 text-[#003366] focus:ring-[#003366]"
                                                            />
                                                            <span className="text-sm text-gray-900 dark:text-gray-100">{s.subject_code} {s.subject_name}</span>
                                                            {s.is_required && <span className="text-xs text-amber-600 dark:text-amber-400">Required</span>}
                                                            {s.allow_retake && <span className="text-xs text-amber-600 dark:text-amber-400">Retake</span>}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEnrollSubjectsModal(false)}
                                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={submitEnrollSubjects}
                                            disabled={enrollSelectedIds.length === 0 || enrollSubmitLoading}
                                            className={`px-4 py-2 rounded-lg ${PRIMARY_COLOR_CLASS} text-white ${HOVER_COLOR_CLASS} disabled:opacity-50`}
                                        >
                                            {enrollSubmitLoading ? 'Enrolling...' : `Enroll (${enrollSelectedIds.length})`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notification && <NotificationComp notification={notification} onClose={() => setNotification(null)} />}
                </div>
            </div>
        </AppLayout>
    );
}
