import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Search, Edit, Trash2, X, RefreshCw, Layers, BookOpen, GraduationCap, Calendar, Filter, Eye, ChevronRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminCourseYearSubjectService, 
    CourseYearSubject, 
    CourseYearSubjectFormData, 
    CourseYearSubjectStats,
    Course,
    Subject
} from '../../../services/AdminCourseYearSubjectService';

// ========================================================================
// 🎨 THEME COLORS
// ========================================================================
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

// ========================================================================
// 📦 INTERFACES & UTILITIES
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// Course with curriculum summary
interface CourseWithCurriculum {
    id: number;
    course_code: string;
    course_name: string;
    level: string;
    total_subjects: number;
    total_units: number;
    subjects: CourseYearSubject[];
}

// Format year level display for college
const formatYearLevel = (yearLevel: number): string => {
    if (yearLevel >= 13) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return yearNames[yearLevel - 13] || `${yearLevel - 12}th Year`;
    }
    return `Grade ${yearLevel}`;
};

// Get year level number for display (13 -> 1, 14 -> 2, etc.)
const getYearNumber = (yearLevel: number): number => {
    if (yearLevel >= 13) return yearLevel - 12;
    return yearLevel;
};

// Get grade level options for Senior High and College
const getCurriculumGradeLevelOptions = () => [
    { value: 11, label: 'Grade 11', level: 'Senior High' },
    { value: 12, label: 'Grade 12', level: 'Senior High' },
    { value: 13, label: '1st Year', level: 'College' },
    { value: 14, label: '2nd Year', level: 'College' },
    { value: 15, label: '3rd Year', level: 'College' },
    { value: 16, label: '4th Year', level: 'College' },
];

// ========================================================================
// 🔔 NOTIFICATION COMPONENT
// ========================================================================

const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' ? PRIMARY_COLOR_CLASS : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW CURRICULUM MODAL - Shows full curriculum for a course
// ========================================================================

const ViewCurriculumModal: React.FC<{
    course: CourseWithCurriculum;
    onClose: () => void;
    onEdit: (link: CourseYearSubject) => void;
    onDelete: (link: CourseYearSubject) => void;
    onAdd: (courseId: number) => void;
}> = ({ course, onClose, onEdit, onDelete, onAdd }) => {
    
    // Group subjects by year and semester
    const groupedSubjects = React.useMemo(() => {
        const groups: Record<string, CourseYearSubject[]> = {};
        
        course.subjects.forEach(subject => {
            const key = `${subject.year_level}-${subject.semester}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(subject);
        });
        
        // Sort subjects within each group by subject code
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => (a.subject?.subject_code || '').localeCompare(b.subject?.subject_code || ''));
        });
        
        return groups;
    }, [course.subjects]);

    // Get unique year levels
    const yearLevels = Array.from(new Set(course.subjects.map(s => s.year_level))).sort((a, b) => a - b);

    // Calculate units per semester
    const getUnitsForSemester = (yearLevel: number, semester: string): number => {
        const key = `${yearLevel}-${semester}`;
        return (groupedSubjects[key] || []).reduce((sum, s) => sum + (s.units || 0), 0);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className={`${PRIMARY_COLOR_CLASS} text-white p-4 sm:p-6`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0" />
                                <span className="truncate">{course.course_code} Curriculum</span>
                            </h2>
                            <p className="text-blue-100 mt-1 text-xs sm:text-sm md:text-base break-words">
                                <span className="block sm:inline">{course.course_name}</span>
                                <span className="hidden sm:inline"> • </span>
                                <span className="block sm:inline">• {course.total_subjects} Subjects • {course.total_units} Total Units</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button 
                                onClick={() => onAdd(course.id)}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden min-[375px]:inline">Add Subject</span>
                                <span className="min-[375px]:hidden">Add</span>
                            </button>
                            <button onClick={onClose} className="rounded-full p-1.5 sm:p-2 hover:bg-white/20 cursor-pointer flex-shrink-0">
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Curriculum Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {yearLevels.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No subjects added to this curriculum yet</p>
                            <button 
                                onClick={() => onAdd(course.id)}
                                className={`mt-4 inline-flex items-center gap-2 px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS}`}
                            >
                                <Plus className="h-5 w-5" />
                                Add First Subject
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {yearLevels.map(yearLevel => (
                                <div key={yearLevel} className="border border-gray-200 rounded-2xl overflow-hidden">
                                    {/* Year Header */}
                                    <div className={`${LIGHT_BG_CLASS} px-6 py-4 border-b border-gray-200`}>
                                        <h3 className={`text-xl font-bold ${TEXT_COLOR_CLASS}`}>
                                            {formatYearLevel(yearLevel)}
                                        </h3>
                                    </div>

                                    {/* Semesters */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                                        {['1st', '2nd'].map(semester => {
                                            const key = `${yearLevel}-${semester}`;
                                            const subjects = groupedSubjects[key] || [];
                                            const totalUnits = getUnitsForSemester(yearLevel, semester);

                                            return (
                                                <div key={semester} className="p-4">
                                                    {/* Semester Header */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-semibold text-gray-700">{semester} Semester</h4>
                                                        <span className={`text-sm font-medium ${TEXT_COLOR_CLASS}`}>
                                                            {subjects.length} subjects • {totalUnits} units
                                                        </span>
                                                    </div>

                                                    {/* Subjects Table */}
                                                    {subjects.length === 0 ? (
                                                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                                                            <p className="text-gray-400 text-sm">No subjects</p>
                                                        </div>
                                                    ) : (
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-gray-200">
                                                                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase w-16">Units</th>
                                                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase w-20">Type</th>
                                                                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase w-20">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {subjects.map(subject => (
                                                                    <tr key={subject.id} className="hover:bg-gray-50">
                                                                        <td className="py-3">
                                                                            <div className="font-medium text-gray-900">{subject.subject?.subject_code}</div>
                                                                            <div className="text-xs text-gray-500">{subject.subject?.subject_name}</div>
                                                                        </td>
                                                                        <td className="py-3 text-center font-semibold text-gray-700">
                                                                            {subject.units}
                                                                        </td>
                                                                        <td className="py-3 text-center">
                                                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                                                                subject.is_required 
                                                                                    ? 'bg-green-100 text-green-700' 
                                                                                    : 'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                                {subject.is_required ? 'Req' : 'Elec'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <button
                                                                                    onClick={() => onEdit(subject)}
                                                                                    className="p-1.5 text-gray-500 hover:text-[#003366] hover:bg-gray-100 rounded-lg transition-colors"
                                                                                    title="Edit"
                                                                                >
                                                                                    <Edit className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => onDelete(subject)}
                                                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                                    title="Remove"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <button 
                        onClick={onClose} 
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📝 ADD/EDIT SUBJECT MODAL
// ========================================================================

const LinkModal: React.FC<{
    link: CourseYearSubject | null;
    preSelectedCourseId?: number;
    courses: Course[];
    subjects: Subject[];
    onClose: () => void;
    onSave: (data: CourseYearSubjectFormData) => Promise<void>;
    onBulkSave: (data: { course_id: number; year_level: number; semester: '1st' | '2nd' | 'summer'; subject_ids: number[] }) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ link, preSelectedCourseId, courses, subjects, onClose, onSave, onBulkSave, errors }) => {
    const [formData, setFormData] = useState<CourseYearSubjectFormData>({
        course_id: link?.course_id || preSelectedCourseId || 0,
        year_level: link?.year_level || 13,
        subject_id: link?.subject_id || 0,
        semester: link?.semester || '1st',
        is_required: link?.is_required ?? true,
        units: link?.units || 3,
        description: link?.description || '',
    });
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load available subjects when course, year, or semester changes
    useEffect(() => {
        const loadAvailableSubjects = async () => {
            if (!formData.course_id || !formData.year_level || !formData.semester) {
                setAvailableSubjects([]);
                return;
            }

            setLoadingSubjects(true);
            try {
                const response = await adminCourseYearSubjectService.getAvailableSubjects({
                    course_id: formData.course_id,
                    year_level: formData.year_level,
                    semester: formData.semester,
                });
                if (response.success) {
                    setAvailableSubjects(response.data);
                }
            } catch (error) {
                console.error('Error loading available subjects:', error);
            } finally {
                setLoadingSubjects(false);
            }
        };

        // Only load available subjects if creating new links (not editing)
        if (!link) {
            loadAvailableSubjects();
        }
    }, [formData.course_id, formData.year_level, formData.semester, link]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (link) {
                // Editing existing link - use single save
                await onSave(formData);
            } else {
                // Creating new links - use bulk save
                if (selectedSubjectIds.length === 0) {
                    throw new Error('Please select at least one subject');
                }
                await onBulkSave({
                    course_id: formData.course_id,
                    year_level: formData.year_level,
                    semester: formData.semester,
                    subject_ids: selectedSubjectIds,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSubjectSelection = (subjectId: number) => {
        setSelectedSubjectIds(prev => 
            prev.includes(subjectId) 
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className={`${PRIMARY_COLOR_CLASS} text-white p-6 rounded-t-2xl`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <LinkIcon className="h-6 w-6" />
                            {link ? 'Edit Subject' : 'Add Subject to Curriculum'}
                        </h2>
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/20">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Course */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Course/Program <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.course_id}
                            onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${RING_COLOR_CLASS} ${errors.course_id ? 'border-red-500' : 'border-gray-200'}`}
                            required
                            disabled={!!preSelectedCourseId}
                        >
                            <option value={0}>Select Course/Program</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.course_code} - {course.course_name}
                                </option>
                            ))}
                        </select>
                        {errors.course_id && <p className="text-red-500 text-sm mt-1">{errors.course_id[0]}</p>}
                    </div>

                    {/* Year Level & Semester Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Year Level <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.year_level}
                                onChange={(e) => setFormData({...formData, year_level: parseInt(e.target.value)})}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${RING_COLOR_CLASS} border-gray-200`}
                                required
                            >
                                <optgroup label="Senior High">
                                    {getCurriculumGradeLevelOptions().filter(o => o.level === 'Senior High').map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="College">
                                    {getCurriculumGradeLevelOptions().filter(o => o.level === 'College').map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Semester <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({...formData, semester: e.target.value as '1st' | '2nd' | 'summer'})}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${RING_COLOR_CLASS} border-gray-200`}
                                required
                            >
                                <option value="1st">1st Semester</option>
                                <option value="2nd">2nd Semester</option>
                                <option value="summer">Summer</option>
                            </select>
                        </div>
                    </div>

                    {/* Subject Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {link ? 'Subject' : 'Select Subjects'} <span className="text-red-500">*</span>
                        </label>
                        
                        {link ? (
                            // Editing: Show single dropdown (can't change subject)
                            <select
                                value={formData.subject_id}
                                disabled
                                className={`w-full px-4 py-3 border rounded-xl bg-gray-100 border-gray-200`}
                            >
                                <option value={link.subject_id}>
                                    {link.subject?.subject_code} - {link.subject?.subject_name}
                                </option>
                            </select>
                        ) : (
                            // Creating: Show checkbox list
                            <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                                {loadingSubjects ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                                        <span className="text-gray-500">Loading available subjects...</span>
                                    </div>
                                ) : availableSubjects.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                        <p>No available subjects</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            All subjects are already linked to this course/year/semester
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {availableSubjects.map(subject => (
                                            <label
                                                key={subject.id}
                                                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubjectIds.includes(subject.id)}
                                                    onChange={() => toggleSubjectSelection(subject.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-[#003366] focus:ring-[#003366] mr-3"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">
                                                        {subject.subject_code}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {subject.subject_name}
                                                    </div>
                                                </div>
                                                {subject.units && (
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {subject.units} units
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!link && selectedSubjectIds.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                {selectedSubjectIds.length} subject{selectedSubjectIds.length !== 1 ? 's' : ''} selected
                            </p>
                        )}
                        {errors.subject_id && <p className="text-red-500 text-sm mt-1">{errors.subject_id[0]}</p>}
                    </div>

                    {/* Units & Required Row - Only show when editing */}
                    {link && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Units</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={9}
                                    value={formData.units}
                                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 3})}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${RING_COLOR_CLASS} border-gray-200`}
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_required}
                                        onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                                        className="w-5 h-5 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Required Subject</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`flex-1 px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} disabled:opacity-50`}
                        >
                            {loading ? 'Saving...' : (link ? 'Update' : 'Add Subject')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========================================================================
// 🗑️ DELETE CONFIRMATION MODAL
// ========================================================================

const DeleteModal: React.FC<{
    link: CourseYearSubject;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}> = ({ link, onClose, onConfirm }) => {
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Subject?</h3>
                    <p className="text-gray-600 mb-6">
                        Remove <strong>{link.subject?.subject_code} - {link.subject?.subject_name}</strong> from 
                        <strong> {link.course?.course_code} {formatYearLevel(link.year_level)}</strong>?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete} 
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📊 MAIN COMPONENT - COURSES WITH CURRICULUM VIEW
// ========================================================================

const CourseYearSubjects: React.FC = () => {
    const [links, setLinks] = useState<CourseYearSubject[]>([]);
    const [coursesWithCurriculum, setCoursesWithCurriculum] = useState<CourseWithCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCurriculumModal, setShowCurriculumModal] = useState(false);
    const [selectedLink, setSelectedLink] = useState<CourseYearSubject | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<CourseWithCurriculum | null>(null);
    const [preSelectedCourseId, setPreSelectedCourseId] = useState<number | undefined>();
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [stats, setStats] = useState<CourseYearSubjectStats>({
        total_links: 0,
        active_links: 0,
        total_courses: 0,
        total_subjects: 0,
        by_course: [],
        by_year_level: [],
    });

    useEffect(() => {
        loadData();
        loadStats();
        loadDropdownData();
    }, []);

    // Group links by course
    useEffect(() => {
        const courseMap = new Map<number, CourseWithCurriculum>();
        
        links.forEach(link => {
            if (!link.course) return;
            
            const courseId = link.course_id;
            if (!courseMap.has(courseId)) {
                courseMap.set(courseId, {
                    id: courseId,
                    course_code: link.course.course_code,
                    course_name: link.course.course_name,
                    level: link.course.level || 'College',
                    total_subjects: 0,
                    total_units: 0,
                    subjects: [],
                });
            }
            
            const course = courseMap.get(courseId)!;
            course.subjects.push(link);
            course.total_subjects++;
            course.total_units += link.units || 0;
        });
        
        // Sort courses by code
        const sortedCourses = Array.from(courseMap.values()).sort((a, b) => 
            a.course_code.localeCompare(b.course_code)
        );
        
        setCoursesWithCurriculum(sortedCourses);
    }, [links]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await adminCourseYearSubjectService.getCourseYearSubjects({
                per_page: 500,
            });
            if (response.success) {
                setLinks(response.data);
            }
        } catch (error) {
            console.error('Error loading curriculum:', error);
            showNotificationMsg('error', 'Failed to load curriculum data');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminCourseYearSubjectService.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadDropdownData = async () => {
        try {
            const [coursesRes, subjectsRes] = await Promise.all([
                adminCourseYearSubjectService.getCourses(),
                adminCourseYearSubjectService.getSubjects(),
            ]);
            if (coursesRes.success) setCourses(coursesRes.data);
            if (subjectsRes.success) setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    const showNotificationMsg = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
    };

    const handleViewCurriculum = (course: CourseWithCurriculum) => {
        setSelectedCourse(course);
        setShowCurriculumModal(true);
    };

    const handleAdd = (courseId?: number) => {
        setSelectedLink(null);
        setPreSelectedCourseId(courseId);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (link: CourseYearSubject) => {
        setSelectedLink(link);
        setPreSelectedCourseId(undefined);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleDelete = (link: CourseYearSubject) => {
        setSelectedLink(link);
        setShowDeleteModal(true);
    };

    const handleSave = async (data: CourseYearSubjectFormData) => {
        try {
            if (selectedLink) {
                const response = await adminCourseYearSubjectService.updateLink(selectedLink.id, data);
                if (response.success) {
                    showNotificationMsg('success', 'Subject updated successfully');
                    setShowModal(false);
                    loadData();
                    loadStats();
                }
            } else {
                const response = await adminCourseYearSubjectService.createLink(data);
                if (response.success) {
                    showNotificationMsg('success', 'Subject added to curriculum');
                    setShowModal(false);
                    loadData();
                    loadStats();
                }
            }
        } catch (error: any) {
            if (error.message.includes(':')) {
                const errors: Record<string, string[]> = {};
                error.message.split('; ').forEach((err: string) => {
                    const [field, msg] = err.split(': ');
                    errors[field] = [msg];
                });
                setValidationErrors(errors);
            }
            showNotificationMsg('error', error.message || 'Failed to save');
        }
    };

    const handleBulkSave = async (data: { course_id: number; year_level: number; semester: '1st' | '2nd' | 'summer'; subject_ids: number[] }) => {
        try {
            const response = await adminCourseYearSubjectService.bulkCreateLinks(data);
            if (response.success) {
                const { created_count, skipped_count } = response.data;
                let message = `${created_count} subject${created_count !== 1 ? 's' : ''} added to curriculum`;
                if (skipped_count > 0) {
                    message += ` (${skipped_count} already linked)`;
                }
                showNotificationMsg('success', message);
                setShowModal(false);
                loadData();
                loadStats();
            }
        } catch (error: any) {
            if (error.message.includes(':')) {
                const errors: Record<string, string[]> = {};
                error.message.split('; ').forEach((err: string) => {
                    const [field, msg] = err.split(': ');
                    errors[field] = [msg];
                });
                setValidationErrors(errors);
            }
            showNotificationMsg('error', error.message || 'Failed to add subjects');
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedLink) return;
        try {
            const response = await adminCourseYearSubjectService.deleteLink(selectedLink.id);
            if (response.success) {
                showNotificationMsg('success', 'Subject removed from curriculum');
                setShowDeleteModal(false);
                loadData();
                loadStats();
                
                // Update the selected course in the modal
                if (selectedCourse) {
                    const updatedCourse = coursesWithCurriculum.find(c => c.id === selectedCourse.id);
                    if (updatedCourse) {
                        setSelectedCourse({
                            ...updatedCourse,
                            subjects: updatedCourse.subjects.filter(s => s.id !== selectedLink.id),
                            total_subjects: updatedCourse.total_subjects - 1,
                            total_units: updatedCourse.total_units - (selectedLink.units || 0),
                        });
                    }
                }
            }
        } catch (error: any) {
            showNotificationMsg('error', error.message || 'Failed to remove subject');
        }
    };

    // Filter courses by search
    const filteredCourses = coursesWithCurriculum.filter(course => 
        !searchTerm || 
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
                {notification && (
                    <NotificationComponent notification={notification} onClose={() => setNotification(null)} />
                )}

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-2xl shadow-lg`}>
                            <Layers className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${TEXT_COLOR_CLASS}`}>Curriculum / Prospectus</h1>
                            <p className="text-xs sm:text-sm text-gray-600">View and manage curriculum for each course</p>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={() => handleAdd()}
                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} shadow-lg font-semibold text-xs sm:text-sm md:text-base`}
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Add Subject</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                        <button onClick={loadData} className="p-2 sm:p-2.5 md:p-3 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-100 bg-white">
                            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''} text-gray-600`} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Mobile: Centered with icon below, Desktop: Icon on right */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                    <div className="bg-white dark:bg-transparent rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white">
                        {/* Mobile: Centered layout */}
                        <div className="flex flex-col items-center text-center md:hidden">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">Courses</p>
                            <p className={`text-xl sm:text-2xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{coursesWithCurriculum.length}</p>
                            <div className={`${LIGHT_BG_CLASS} p-2 sm:p-3 rounded-full`}>
                                <GraduationCap className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                        {/* Desktop: Original layout with icon on right */}
                        <div className="hidden md:flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">Total Courses</p>
                                <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{coursesWithCurriculum.length}</p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                <GraduationCap className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-transparent rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white">
                        {/* Mobile: Centered layout */}
                        <div className="flex flex-col items-center text-center md:hidden">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">Subjects</p>
                            <p className={`text-xl sm:text-2xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{links.length}</p>
                            <div className={`${LIGHT_BG_CLASS} p-2 sm:p-3 rounded-full`}>
                                <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                        {/* Desktop: Original layout with icon on right */}
                        <div className="hidden md:flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">Total Subjects</p>
                                <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{links.length}</p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                <BookOpen className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-transparent rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white">
                        {/* Mobile: Centered layout */}
                        <div className="flex flex-col items-center text-center md:hidden">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">Units</p>
                            <p className={`text-xl sm:text-2xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>
                                {links.reduce((sum, l) => sum + (l.units || 0), 0)}
                            </p>
                            <div className={`${LIGHT_BG_CLASS} p-2 sm:p-3 rounded-full`}>
                                <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                        {/* Desktop: Original layout with icon on right */}
                        <div className="hidden md:flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">Total Units</p>
                                <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>
                                    {links.reduce((sum, l) => sum + (l.units || 0), 0)}
                                </p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                <Calendar className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-transparent rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white">
                        {/* Mobile: Centered layout */}
                        <div className="flex flex-col items-center text-center md:hidden">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">Unique</p>
                            <p className={`text-xl sm:text-2xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{stats.total_subjects}</p>
                            <div className={`${LIGHT_BG_CLASS} p-2 sm:p-3 rounded-full`}>
                                <LinkIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                        {/* Desktop: Original layout with icon on right */}
                        <div className="hidden md:flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">Unique Subjects</p>
                                <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{stats.total_subjects}</p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                <LinkIcon className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search - Compact on Mobile */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                    <div className="flex items-center">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} text-sm sm:text-base`}
                            placeholder="Search courses..."
                        />
                    </div>
                </div>

                {/* Courses Table - Responsive: Mobile shows Course Code & Name + Actions, Desktop shows all columns */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={`${PRIMARY_COLOR_CLASS}`}>
                                <tr>
                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Course Code</th>
                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Course Name</th>
                                    <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Subjects</th>
                                    <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Total Units</th>
                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400 mb-2" />
                                                <p className="text-sm sm:text-base text-gray-500">Loading courses...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                <p className={`${TEXT_COLOR_CLASS} font-medium text-base sm:text-lg`}>No courses with curriculum</p>
                                                <p className="text-gray-500 text-xs sm:text-sm">Add subjects to courses to see them here</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCourses.map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-bold rounded-lg ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS}`}>
                                                    {course.course_code}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{course.course_name}</div>
                                                <div className="text-xs text-gray-500 truncate">{course.level}</div>
                                                {/* Show additional info on mobile */}
                                                <div className="md:hidden mt-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600">{course.total_subjects} subjects</span>
                                                        <span className="text-xs text-gray-600">•</span>
                                                        <span className="text-xs text-gray-600">{course.total_units} units</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                                <span className="text-xs sm:text-sm font-semibold text-gray-900">{course.total_subjects}</span>
                                                <span className="text-xs sm:text-sm text-gray-500 ml-1">subjects</span>
                                            </td>
                                            <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                                <span className="text-xs sm:text-sm font-semibold text-gray-900">{course.total_units}</span>
                                                <span className="text-xs sm:text-sm text-gray-500 ml-1">units</span>
                                            </td>
                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleViewCurriculum(course)}
                                                    className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium text-xs sm:text-sm`}
                                                >
                                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span className="hidden sm:inline">View Curriculum</span>
                                                    <span className="sm:hidden">View</span>
                                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals */}
                {showCurriculumModal && selectedCourse && (
                    <ViewCurriculumModal
                        course={selectedCourse}
                        onClose={() => {
                            setShowCurriculumModal(false);
                            setSelectedCourse(null);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAdd}
                    />
                )}

                {showModal && (
                    <LinkModal
                        link={selectedLink}
                        preSelectedCourseId={preSelectedCourseId}
                        courses={courses}
                        subjects={subjects}
                        onClose={() => {
                            setShowModal(false);
                            setPreSelectedCourseId(undefined);
                        }}
                        onSave={handleSave}
                        onBulkSave={handleBulkSave}
                        errors={validationErrors}
                    />
                )}

                {showDeleteModal && selectedLink && (
                    <DeleteModal
                        link={selectedLink}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={handleConfirmDelete}
                    />
                )}
            </div>
        </AppLayout>
    );
};

export default CourseYearSubjects;

