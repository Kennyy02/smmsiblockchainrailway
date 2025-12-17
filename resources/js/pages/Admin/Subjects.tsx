import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Layers, Zap, Hash } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminSubjectService, 
    Subject, 
    SubjectFormData, 
    SubjectStats, 
    SubjectsResponse, 
    ApiResponse
} from '../../../services/AdminSubjectService'; 
// NOTE: Ensure SubjectFormData in AdminSubjectService.ts no longer includes 'is_core' or 'department_id'.

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📦 INTERFACES 
// ========================================================================

interface Notification {
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
    total: number;
}

// ========================================================================
// 🔔 NOTIFICATION COMPONENT (Reused)
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
// 📝 SUBJECT MODAL (For Add/Edit)
// ========================================================================

const SubjectModal: React.FC<{
    subject: Subject | null;
    onClose: () => void;
    onSave: (data: SubjectFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ subject, onClose, onSave, errors }) => {

    const [formData, setFormData] = useState<SubjectFormData>({
        subject_code: subject?.subject_code || '',
        subject_name: subject?.subject_name || '', 
        units: subject?.units || 3,
        description: subject?.description || '',
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
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' 
                ? parseInt(value) || 0 
                : value 
        }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {subject ? 'Edit Subject' : 'Add New Subject'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Code</label>
                                <input
                                    type="text"
                                    name="subject_code"
                                    value={formData.subject_code}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="e.g., MAR-101"
                                    required
                                />
                                {errors.subject_code && (<p className="text-red-500 text-xs mt-1">{errors.subject_code[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name</label>
                                <input
                                    type="text"
                                    name="subject_name" 
                                    value={formData.subject_name} 
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="e.g., Marine Ecology"
                                    required
                                />
                                {errors.subject_name && (<p className="text-red-500 text-xs mt-1">{errors.subject_name[0]}</p>)} 
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Units</label>
                            <input
                                type="number"
                                name="units"
                                value={formData.units}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                min="1"
                                required
                            />
                            {errors.units && (<p className="text-red-500 text-xs mt-1">{errors.units[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                rows={3}
                                placeholder="Brief summary of the subject content."
                            />
                            {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>)}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : subject ? 'Update Subject' : 'Add Subject'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// ❌ DELETE CONFIRMATION MODAL
// ========================================================================

const DeleteSubjectModal: React.FC<{
    subject: Subject;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ subject, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(subject.id);
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
                        <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Are you absolutely sure you want to delete the subject: 
                            <strong className="text-red-700 block mt-1">{subject.subject_code} - {subject.subject_name}</strong>? 
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
                                {loading ? 'Deleting...' : 'Delete Subject'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 🏠 MAIN SUBJECTS PAGE
// ========================================================================

const Subjects: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    // Filters simplified
    const [filters, setFilters] = useState<Filters>({
        search: '',
        page: 1,
        per_page: 10,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Stats simplified
    const [stats, setStats] = useState<SubjectStats>({
        total_subjects: 0,
        by_department: [],
    } as SubjectStats);

    useEffect(() => {
        loadSubjects();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadSubjects();
        }, 500);
        
        // Dependency array simplified
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.page, filters.per_page]);

    const loadSubjects = async () => {
        setLoading(true);
        try {
            // API filters simplified to only include search, page, per_page
            const apiFilters = { ...filters };
            
            const response: SubjectsResponse = await adminSubjectService.getSubjects(apiFilters);
            if (response.success) {
                setSubjects(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
            setNotification({ type: 'error', message: 'Failed to load subject data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminSubjectService.getSubjectStats();
            if (response.success) {
                // Only keep used stats fields
                setStats(prev => ({
                    ...prev,
                    total_subjects: response.data.total_subjects || 0,
                    // If your API still returns core/elective stats, discard them here:
                    // core_subjects: 0,
                    // elective_subjects: 0,
                    by_department: response.data.by_department || [],
                }));
            }
        } catch (error) {
            console.error('Error loading subject stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedSubject(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (subject: Subject) => {
        setSelectedSubject(subject);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: SubjectFormData) => {
        try {
            let response: ApiResponse<Subject>;
            if (selectedSubject) {
                response = await adminSubjectService.updateSubject(selectedSubject.id, data);
                setNotification({ type: 'success', message: 'Subject updated successfully!' });
            } else {
                response = await adminSubjectService.createSubject(data);
                setNotification({ type: 'success', message: 'Subject added successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadSubjects();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save subject' });
        }
    };

    const handleDelete = (subject: Subject) => {
        setSelectedSubject(subject);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminSubjectService.deleteSubject(id);
            setNotification({ type: 'success', message: 'Subject deleted successfully!' });
            setShowDeleteModal(false);
            loadSubjects();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting subject:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete subject. Check if it is linked to classes.' });
            setShowDeleteModal(false);
        }
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;
        return null;
    };


    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <BookOpen className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
                                <p className="text-gray-600 mt-1">Manage curriculum, subject details, and units</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Subject
                            </button>
                            
                            <button 
                                onClick={() => { loadSubjects(); loadStats(); }}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards (Simplified) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Subjects</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_subjects}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Hash className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                      
                    </div>

                    {/* Filters (Simplified) */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4"> {/* Changed to 1 column */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Search code or name..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table (Type column removed) */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Units</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} /></td></tr>
                                    ) : subjects.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No subjects found</td></tr>
                                    ) : (
                                        subjects.map((subject) => (
                                            <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{subject.subject_code}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subject_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{subject.units}</td>
                                                <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-500">{subject.description || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(subject)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Subject"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(subject)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Subject"
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
                        <SubjectModal
                            subject={selectedSubject}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showDeleteModal && selectedSubject && (
                        <DeleteSubjectModal
                            subject={selectedSubject}
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

export default Subjects;