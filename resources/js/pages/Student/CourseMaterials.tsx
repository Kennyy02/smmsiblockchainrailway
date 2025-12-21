// ============================================
// FILE: pages/Student/CourseMaterials.tsx
// Student view for Course Materials (Read-only with download)
// Now subject-based instead of class-subject-based
// ============================================
import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { BookOpen, Search, Download, FileText, File, RefreshCw, FolderOpen, X, Filter } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminCourseMaterialService, 
    CourseMaterial, 
    Subject,
} from '../../../services/AdminCourseMaterialService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-blue-900';
const TEXT_COLOR_CLASS = 'text-blue-900';
const RING_COLOR_CLASS = 'focus:ring-blue-500';
const LIGHT_BG_CLASS = 'bg-blue-50';

// ========================================================================
// NOTIFICATION COMPONENT
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

// Map file types to icons
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
// MAIN COMPONENT
// ========================================================================
const CourseMaterials: React.FC = () => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationData | null>(null);
    
    const [filters, setFilters] = useState({
        subject_id: '',
        search: '',
    });

    // Load subjects for filter dropdown
    const loadSubjects = async () => {
        try {
            const response = await adminCourseMaterialService.getSubjects();
            if (response.success && response.data) {
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

    const handleDownload = async (material: CourseMaterial) => {
        try {
            const extension = material.file_path?.split('.').pop() || '';
            const filename = extension ? `${material.title}.${extension}` : material.title;
            setNotification({ type: 'success', message: `Downloading ${filename}...` });
            await adminCourseMaterialService.downloadMaterial(material.id, filename);
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Download failed' });
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <FolderOpen className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Materials</h1>
                                <p className="text-gray-600 dark:text-white mt-1">Download learning resources for your subjects</p>
                            </div>
                        </div>
                        <button onClick={() => loadMaterials()} className="p-3 bg-white dark:bg-gray-800 dark:border-white border border-gray-300 dark:border-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''} text-gray-600 dark:text-white`} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 mb-6 border dark:border-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative col-span-2">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 ${RING_COLOR_CLASS}`}
                                    placeholder="Search materials..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 dark:text-white mr-3" />
                                <select
                                    value={filters.subject_id}
                                    onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                                    className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 ${RING_COLOR_CLASS} bg-white dark:bg-gray-900`}
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

                    {/* Materials Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <RefreshCw className="h-10 w-10 text-blue-500 dark:text-white animate-spin" />
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-12 text-center border dark:border-white">
                            <BookOpen className="h-16 w-16 text-gray-300 dark:text-white mx-auto mb-4" />
                            <h3 className={`text-xl font-semibold ${TEXT_COLOR_CLASS} dark:text-white mb-2`}>No Materials Found</h3>
                            <p className="text-gray-500 dark:text-white">No course materials are available for your selected filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materials.map((material) => {
                                const IconComponent = getFileIcon(material.file_path?.split('.').pop() || '');
                                return (
                                    <div key={material.id} className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border dark:border-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${LIGHT_BG_CLASS}`}>
                                                <IconComponent className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                            </div>
                                            <button
                                                onClick={() => handleDownload(material)}
                                                className="p-2 bg-green-50 dark:bg-green-900 dark:border-white text-green-600 dark:text-white rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors border dark:border-white"
                                                title="Download"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate" title={material.title}>{material.title}</h3>
                                        <p className="text-sm text-blue-600 dark:text-white font-medium mb-2">{material.subject?.subject_code} - {material.subject?.subject_name}</p>
                                        <p className="text-sm text-gray-500 dark:text-white mb-3 line-clamp-2">{material.description || 'No description'}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white pt-3 border-t dark:border-white">
                                            <span>{formatFileSize(material.file_size)}</span>
                                            <span>{new Date(material.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Notification */}
                    {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
                </div>
            </div>
        </AppLayout>
    );
};

export default CourseMaterials;
