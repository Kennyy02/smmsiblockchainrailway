// ============================================
// FILE: pages/Teacher/CourseMaterials.tsx
// Teacher view for Course Materials (Full CRUD)
// Now subject-based instead of class-subject-based
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Upload, Search, Filter, Edit, Trash2, X, RefreshCw, Download, FileText, File, FolderOpen } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminCourseMaterialService, 
    CourseMaterial, 
    CourseMaterialUpdateData, 
    CourseMaterialUploadData,
    Subject,
    ApiResponse 
} from '../../../services/AdminCourseMaterialService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-blue-900';
const HOVER_COLOR_CLASS = 'hover:bg-blue-800';
const TEXT_COLOR_CLASS = 'text-blue-900';
const RING_COLOR_CLASS = 'focus:ring-blue-500';
const LIGHT_BG_CLASS = 'bg-blue-50';
const LIGHT_HOVER_CLASS = 'hover:bg-blue-100';

// ========================================================================
// INTERFACES & UTILITIES
// ========================================================================
interface NotificationData { type: 'success' | 'error'; message: string; }

const Notification: React.FC<{ notification: NotificationData; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3`}>
            <span className="font-medium">{notification.message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

const getFileIcon = (fileExtension: string) => {
    const ext = fileExtension?.toLowerCase() || '';
    switch (ext) {
        case 'pdf':
        case 'doc':
        case 'docx':
        case 'xls':
        case 'xlsx':
        case 'ppt':
        case 'pptx':
            return FileText;
        default:
            return File;
    }
};

// ========================================================================
// UPLOAD/EDIT MODAL
// ========================================================================
const MaterialModal: React.FC<{
    material: CourseMaterial | null;
    onClose: () => void;
    onSave: (data: CourseMaterialUploadData | CourseMaterialUpdateData, isNew: boolean) => Promise<void>;
    errors: Record<string, string[]>;
    subjects: Subject[];
}> = ({ material, onClose, onSave, errors, subjects }) => {

    const isNew = !material;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<CourseMaterialUpdateData & { file?: File }>({
        subject_id: material?.subject_id || subjects[0]?.id || 0,
        title: material?.title || '',
        description: material?.description || '',
        file: undefined,
    });
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (!material && subjects.length > 0 && formData.subject_id === 0) {
            setFormData(prev => ({ ...prev, subject_id: subjects[0].id }));
        }
    }, [subjects, material, formData.subject_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isNew && !formData.file) {
            alert("Please select a file to upload.");
            setLoading(false);
            return;
        }

        try {
            if (isNew) {
                await onSave(formData as CourseMaterialUploadData, true);
            } else {
                const updateData: CourseMaterialUpdateData = {
                    subject_id: formData.subject_id,
                    title: formData.title,
                    description: formData.description,
                };
                await onSave(updateData, false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, files } = e.target as HTMLInputElement;
        
        if (type === 'file' && files) {
            setFormData(prev => ({ ...prev, file: files[0] }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: name === 'subject_id' ? parseInt(value) : value 
            } as CourseMaterialUpdateData & { file?: File }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-2xl border dark:border-white">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4 rounded-t-2xl`}>
                        <h2 className="text-xl font-bold text-white">
                            {isNew ? 'Upload New Course Material' : `Edit: ${material?.title}`}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Subject <span className="text-red-500">*</span></label>
                            <select
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 ${RING_COLOR_CLASS} bg-white dark:bg-gray-900`}
                                required
                            >
                                <option value={0} disabled>Select Subject</option>
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.subject_code} - {subject.subject_name}
                                    </option>
                                ))}
                            </select>
                            {errors.subject_id && (<p className="text-red-500 text-xs mt-1">{errors.subject_id[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Material Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 ${RING_COLOR_CLASS}`}
                                placeholder="e.g., Chapter 1 Lecture Slides"
                                required
                            />
                            {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 ${RING_COLOR_CLASS}`}
                                placeholder="Notes about the material..."
                            />
                        </div>
                        
                        {isNew && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Upload File <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    name="file"
                                    ref={fileInputRef}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-gray-800 file:text-blue-700 dark:file:text-white hover:file:bg-blue-100 dark:hover:file:bg-gray-700`}
                                    required={isNew}
                                />
                                {formData.file && (<p className="text-xs text-gray-500 dark:text-white mt-1">Selected: {formData.file.name}</p>)}
                                {errors.file && (<p className="text-red-500 text-xs mt-1">{errors.file[0]}</p>)}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-white">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 dark:border-white rounded-xl text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} disabled:opacity-50`} disabled={loading || (isNew && !formData.file)}>
                                {loading ? 'Saving...' : isNew ? 'Upload' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// MAIN TEACHER COURSE MATERIALS PAGE
// ========================================================================
const TeacherCourseMaterials: React.FC = () => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState({
        subject_id: '',
        search: '',
    });

    const loadSubjects = async () => {
        try {
            const response = await adminCourseMaterialService.getSubjects();
            if (response.success) {
                setSubjects(response.data);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    useEffect(() => {
        loadSubjects();
        loadMaterials();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadMaterials();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters.subject_id, filters.search]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const params = {
                subject_id: filters.subject_id ? parseInt(filters.subject_id) : undefined,
                search: filters.search || undefined,
            };
            const response = await adminCourseMaterialService.getCourseMaterials(params);
            if (response.success) {
                setMaterials(response.data);
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to load materials' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = () => {
        setSelectedMaterial(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: CourseMaterialUploadData | CourseMaterialUpdateData, isNew: boolean) => {
        setValidationErrors({});
        try {
            if (isNew) {
                await adminCourseMaterialService.uploadMaterial(data as CourseMaterialUploadData);
                setNotification({ type: 'success', message: 'Material uploaded successfully!' });
            } else if (selectedMaterial) {
                await adminCourseMaterialService.updateMaterial(selectedMaterial.id, data as CourseMaterialUpdateData);
                setNotification({ type: 'success', message: 'Material updated successfully!' });
            }
            setShowModal(false);
            loadMaterials();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to save material' });
        }
    };

    const handleDownload = async (material: CourseMaterial) => {
        try {
            const extension = material.file_path?.split('.').pop() || '';
            const filename = extension ? `${material.title}.${extension}` : material.title;
            await adminCourseMaterialService.downloadMaterial(material.id, filename);
            setNotification({ type: 'success', message: 'Download started' });
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Download failed' });
        }
    };

    const handleDelete = async (material: CourseMaterial) => {
        if (window.confirm(`Delete "${material.title}"? This cannot be undone.`)) {
            try {
                await adminCourseMaterialService.deleteMaterial(material.id);
                setNotification({ type: 'success', message: 'Material deleted' });
                setMaterials(prev => prev.filter(m => m.id !== material.id));
            } catch (error: any) {
                setNotification({ type: 'error', message: error.message || 'Delete failed' });
            }
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    return (
        <AppLayout>
            <Head title="Course Materials" />
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <FolderOpen className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Materials</h1>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">Upload and manage learning resources by subject</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={handleUpload} className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} shadow-lg font-medium`}>
                                <Upload className="h-5 w-5 mr-2" />
                                Upload Material
                            </button>
                            <button onClick={() => loadMaterials()} className="p-3 bg-white dark:bg-gray-800 dark:border-white border border-gray-300 dark:border-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 mb-6 border dark:border-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative col-span-2">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    className="pl-12 w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search materials..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 dark:text-white mr-3" />
                                <select
                                    value={filters.subject_id}
                                    onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                                >
                                    <option value="">All Subjects</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.subject_code} - {subject.subject_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Materials Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Material</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Size</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" /></td></tr>
                                ) : materials.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No materials found. Click "Upload Material" to add one.</td></tr>
                                ) : (
                                    materials.map((material) => {
                                        const IconComponent = getFileIcon(material.file_path?.split('.').pop() || '');
                                        return (
                                            <tr key={material.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className={`p-2 rounded-lg mr-3 ${LIGHT_BG_CLASS}`}>
                                                            <IconComponent className={`h-5 w-5 ${TEXT_COLOR_CLASS}`} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-white">{material.title}</div>
                                                            <div className="text-sm text-gray-500 dark:text-white truncate max-w-xs">{material.description || '-'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium">{material.subject?.subject_code}</div>
                                                    <div className="text-xs text-gray-500 dark:text-white">{material.subject?.subject_name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{formatFileSize(material.file_size)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{new Date(material.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => handleDownload(material)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Download">
                                                            <Download className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => handleEdit(material)} className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg`} title="Edit">
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(material)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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

                    {/* Modals & Notifications */}
                    {showModal && (
                        <MaterialModal
                            material={selectedMaterial}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                            subjects={subjects}
                        />
                    )}
                    {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
                </div>
            </div>
        </AppLayout>
    );
};

export default TeacherCourseMaterials;
