import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, Search, Filter, Edit, Trash2, X, RefreshCw, Download, FileText, File, Eye } from 'lucide-react';
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
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// INTERFACES & UTILS
// ========================================================================

interface Notification { type: 'success' | 'error'; message: string; }

interface Filters { 
    subject_id: string; 
    search: string;
}

const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' ? PRIMARY_COLOR_CLASS : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Map file types to Lucide icons
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
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': 
            return File;
        default: 
            return File;
    }
}

// ========================================================================
// 👁️ VIEW MATERIAL MODAL
// ========================================================================

const ViewMaterialModal: React.FC<{
    material: CourseMaterial;
    onClose: () => void;
    formatFileSize: (bytes?: number) => string;
    getFileIcon: (extension: string) => React.ElementType;
}> = ({ material, onClose, formatFileSize, getFileIcon }) => {
    const IconComponent = getFileIcon(material.file_path?.split('.').pop() || '');
    
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Material Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Header with Icon */}
                        <div className="flex items-center mb-6 pb-6 border-b">
                            <div className={`${LIGHT_BG_CLASS} p-4 rounded-full mr-4`}>
                                <IconComponent className={`h-12 w-12 ${TEXT_COLOR_CLASS}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{material.title}</h3>
                                <p className="text-gray-500">{material.subject?.subject_code} - {material.subject?.subject_name}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                                <p className="text-gray-900 font-medium mt-1">{material.title}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                                <p className="text-gray-900 font-medium mt-1">{material.subject?.subject_code} - {material.subject?.subject_name}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                                <p className="text-gray-900 font-medium mt-1">{material.description || 'No description'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Size</label>
                                <p className="text-gray-900 font-medium mt-1">{formatFileSize(material.file_size)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</label>
                                <p className="text-gray-900 font-medium mt-1">{new Date(material.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploader</label>
                                <p className="text-gray-900 font-medium mt-1">{material.uploader?.name || 'Unknown'}</p>
                            </div>
                        </div>

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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <h2 className="text-xl font-bold text-white">
                            {isNew ? 'Upload New Course Material' : `Edit: ${material?.title}`}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                            <select
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Material Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="e.g., Chapter 1 Lecture Slides"
                                required
                            />
                            {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="Notes about the material or file content..."
                            />
                            {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>)}
                        </div>
                        
                        {isNew && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    name="file"
                                    ref={fileInputRef}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                                    required={isNew}
                                />
                                {formData.file && (<p className="text-xs text-gray-500 mt-1">Selected: {formData.file.name}</p>)}
                                {errors.file && (<p className="text-red-500 text-xs mt-1">{errors.file[0]}</p>)}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading || (isNew && !formData.file)}>
                                {loading ? 'Saving...' : isNew ? 'Upload Material' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// MAIN COURSE MATERIALS PAGE
// ========================================================================

const CourseMaterials: React.FC = () => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        subject_id: '',
        search: '',
    });

    const loadSubjects = async () => {
        try {
            const response = await adminCourseMaterialService.getSubjects();
            if (response.success && response.data) {
                setSubjects(response.data);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

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
            setNotification({ type: 'error', message: 'Failed to load course materials' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = () => {
        setSelectedMaterial(null);
        setValidationErrors({});
        setShowModal(true);
        setNotification(null);
    };

    const handleEdit = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setValidationErrors({});
        setShowModal(true);
        setNotification(null);
    };

    const handleView = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setShowViewModal(true);
    };

    const handleSave = async (data: CourseMaterialUploadData | CourseMaterialUpdateData, isNew: boolean) => {
        setValidationErrors({});
        setNotification(null);

        try {
            let response: ApiResponse<CourseMaterial>;
            
            if (isNew) {
                response = await adminCourseMaterialService.uploadMaterial(data as CourseMaterialUploadData);
                setNotification({ type: 'success', message: 'Material uploaded successfully!' });
            } else if (selectedMaterial) {
                response = await adminCourseMaterialService.updateMaterial(selectedMaterial.id, data as CourseMaterialUpdateData);
                setNotification({ type: 'success', message: 'Material updated successfully!' });
            } else {
                return;
            }
            
            if (response.success) {
                setShowModal(false);
                loadMaterials();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save material' });
        }
    };
    
    const handleDownload = async (material: CourseMaterial) => {
        setNotification(null); 
        try {
            const extension = material.file_path?.split('.').pop() || '';
            const filename = extension ? `${material.title}.${extension}` : material.title;
            setNotification({ type: 'success', message: `Downloading ${filename}...` });
            await adminCourseMaterialService.downloadMaterial(material.id, filename);
            setNotification({ type: 'success', message: `Download completed.` });
        } catch (error: any) {
             setNotification({ type: 'error', message: error.message || 'Failed to start download.' });
        }
    }

    const handleDelete = (material: CourseMaterial) => {
        if (window.confirm(`Are you sure you want to delete "${material.title}"? This will permanently delete the file.`)) {
            handleConfirmDelete(material.id);
        }
    };
    
    const handleConfirmDelete = async (id: number) => {
        setNotification(null);
        
        try {
            const response = await adminCourseMaterialService.deleteMaterial(id);
            if (response.success) {
                setNotification({ type: 'success', message: 'Course material deleted successfully!' });
                setMaterials(prev => prev.filter(m => m.id !== id));
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete material' });
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 sm:mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Course Materials</h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage learning resources by subject</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 sm:space-x-3">
                            <button 
                                onClick={handleUpload}
                                className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium text-xs sm:text-sm md:text-base`}
                            >
                                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Upload Material</span>
                                <span className="sm:hidden">Upload</span>
                            </button>
                            
                            <button 
                                onClick={() => { loadMaterials(); setNotification(null); }}
                                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="relative md:col-span-2">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                    placeholder="Search by title or description..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.subject_id}
                                    onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
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

                    {/* Table - Responsive: Mobile shows Material + Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Material</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Subject</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Description</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">File Size</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Uploaded</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : materials.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No course materials found</p>
                                                    <p className="text-xs sm:text-sm">Upload a new material or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        materials.map((material) => {
                                            const IconComponent = getFileIcon(material.file_path?.split('.').pop() || '');
                                            
                                            return (
                                                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <div className="flex items-center">
                                                            <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${LIGHT_BG_CLASS}`}>
                                                                <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${TEXT_COLOR_CLASS}`} />
                                                            </div>
                                                            <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{material.title}</div>
                                                        </div>
                                                        {/* Show additional info on mobile */}
                                                        <div className="md:hidden mt-1 space-y-1">
                                                            <div className="text-xs text-gray-600">{material.subject?.subject_code} - {material.subject?.subject_name}</div>
                                                            <div className="text-xs text-gray-500 truncate">{material.description || '-'}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-600">{formatFileSize(material.file_size)}</span>
                                                                <span className="text-xs text-gray-600">•</span>
                                                                <span className="text-xs text-gray-600">{new Date(material.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900">{material.subject?.subject_code}</div>
                                                        <div className="text-xs text-gray-500">{material.subject?.subject_name}</div>
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 max-w-xs truncate" title={material.description || 'N/A'}>
                                                        {material.description || '-'}
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                                                        {formatFileSize(material.file_size)}
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm text-gray-700">{new Date(material.created_at).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-500">{material.uploader?.name || 'Unknown'}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-1 sm:space-x-2">
                                                            <button
                                                                onClick={() => handleView(material)}
                                                                className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(material)}
                                                                className={`p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                                                                title="Download File"
                                                            >
                                                                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(material)}
                                                                className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(material)}
                                                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
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
                    </div>

                    {/* Modals */}
                    {showModal && (
                        <MaterialModal
                            material={selectedMaterial}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                            subjects={subjects}
                        />
                    )}

                    {showViewModal && selectedMaterial && (
                        <ViewMaterialModal
                            material={selectedMaterial}
                            onClose={() => setShowViewModal(false)}
                            formatFileSize={formatFileSize}
                            getFileIcon={getFileIcon}
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

export default CourseMaterials;
