import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Users, BookOpen, Clock, Calendar, Eye, Info, User, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

// --- SERVICE INTERFACES & UTILS ---
import { 
    adminAnnouncementService, 
    Announcement, 
    AnnouncementFormData, 
    AnnouncementStats, 
    AnnouncementsResponse, 
    TargetAudience,
    PaginationData,
    AnnouncementStatus,
} from '../../../services/AdminAnnouncementService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#E74C3C]';
const HOVER_COLOR_CLASS = 'hover:bg-[#C0392B]';
const TEXT_COLOR_CLASS = 'text-[#E74C3C]';
const RING_COLOR_CLASS = 'focus:ring-[#E74C3C]';
const LIGHT_BG_CLASS = 'bg-[#E74C3C]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#fdecea]';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    audience: string;
    status: string;
    page: number;
    per_page: number;
}

const AUDIENCE_OPTIONS: TargetAudience[] = ['All', 'Teachers', 'Students', 'Parents'];
const STATUS_OPTIONS: AnnouncementStatus[] = ['Published', 'Draft', 'Scheduled'];

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
// 👁️ VIEW DETAILS MODAL
// ========================================================================

const ViewDetailsModal: React.FC<{
    announcement: Announcement;
    onClose: () => void;
    onEdit: (announcement: Announcement) => void;
}> = ({ announcement, onClose, onEdit }) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Eye className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">Announcement Details</h2>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-blue-600" />
                                Basic Information
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">ID</label>
                                    <p className="text-sm font-mono bg-white px-3 py-2 rounded-lg border">{announcement.id}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created By (User ID)</label>
                                    <p className="text-sm font-mono bg-white px-3 py-2 rounded-lg border">{announcement.created_by}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                                <p className="text-base font-semibold bg-white px-4 py-3 rounded-lg border">{announcement.title}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                Content
                            </h3>
                            <div className="bg-white px-4 py-3 rounded-lg border min-h-[120px] max-h-[300px] overflow-y-auto">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                            </div>
                        </div>

                        {/* Audience & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                                    Target Audience
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                        <Users className="w-4 h-4 mr-2" />
                                        {announcement.target_audience}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-orange-600" />
                                    Status
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {announcement.status === 'Published' && (
                                        <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                                            Published
                                        </span>
                                    )}
                                    {announcement.status === 'Draft' && (
                                        <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                            Draft
                                        </span>
                                    )}
                                    {announcement.status === 'Scheduled' && (
                                        <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                            Scheduled
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                                Timestamps
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Published At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-mono">
                                        {formatDate(announcement.published_at)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expires At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-mono">
                                        {announcement.expires_at ? formatDate(announcement.expires_at) : 'Never'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-mono">
                                        {formatDate(announcement.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Updated At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-mono">
                                        {formatDate(announcement.updated_at || announcement.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deleted At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-mono">
                                        {announcement.deleted_at ? formatDate(announcement.deleted_at) : 'Not Deleted'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Creator Information */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <User className="w-5 h-5 mr-2 text-blue-600" />
                                Creator Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border">
                                        {announcement.creator?.name || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border">
                                        {announcement.creator?.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border capitalize">
                                        {announcement.creator?.role || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-white transition-colors font-medium"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onEdit(announcement);
                                onClose();
                            }}
                            className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg flex items-center`}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Announcement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📝 ANNOUNCEMENT MODAL (For Add/Edit)
// ========================================================================

const AnnouncementModal: React.FC<{
    announcement: Announcement | null;
    onClose: () => void;
    onSave: (data: AnnouncementFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ announcement, onClose, onSave, errors }) => {

    const initialPublishedAt = useMemo(() => {
        if (announcement?.published_at) {
            const date = new Date(announcement.published_at);
            const pad = (num: number) => num.toString().padStart(2, '0');
            // Format for datetime-local input (YYYY-MM-DDThh:mm)
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
        return '';
    }, [announcement]);

    const initialExpiresAt = useMemo(() => {
        if (announcement?.expires_at) {
            const date = new Date(announcement.expires_at);
            const pad = (num: number) => num.toString().padStart(2, '0');
            // Format for datetime-local input (YYYY-MM-DDThh:mm)
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
        return '';
    }, [announcement]);

    const [formData, setFormData] = useState<AnnouncementFormData>({
        title: announcement?.title || '',
        content: announcement?.content || '',
        target_audience: announcement?.target_audience || 'Students',
        published_at: initialPublishedAt,
        expires_at: initialExpiresAt,
    });

    const [loading, setLoading] = useState(false);
    const isEditing = !!announcement;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Prepare data for API: convert local datetime string back to ISO string or null
            const dataToSubmit: AnnouncementFormData = {
                ...formData,
                published_at: formData.published_at && formData.published_at.trim() !== '' 
                    ? new Date(formData.published_at).toISOString() 
                    : null,
                expires_at: formData.expires_at && formData.expires_at.trim() !== '' 
                    ? new Date(formData.expires_at).toISOString() 
                    : null,
            };
            
            await onSave(dataToSubmit);
            // onSave handles closing the modal and loading data on success
        } catch (error) {
            console.error('❌ FORM SUBMIT ERROR:', error);
            // Note: Error state handling is delegated to the parent Announcements component's handleSave
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Use type assertion here as we know the names match the AnnouncementFormData keys
        setFormData(prev => ({ ...prev, [name]: value } as AnnouncementFormData));
    };

    const title = isEditing ? 'Edit Announcement' : 'Create New Announcement';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                required
                            />
                            {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>)}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={6}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                required
                            />
                            {errors.content && (<p className="text-red-500 text-xs mt-1">{errors.content[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Target Audience <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="target_audience"
                                value={formData.target_audience}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                            >
                                {AUDIENCE_OPTIONS.map(audience => (
                                    <option key={audience} value={audience}>{audience}</option>
                                ))}
                            </select>
                            {errors.target_audience && (<p className="text-red-500 text-xs mt-1">{errors.target_audience[0]}</p>)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Publish Date (Optional for Draft)
                                </label>
                                <input
                                    type="datetime-local"
                                    name="published_at"
                                    // published_at is a string representing local date/time, or null/undefined
                                    value={formData.published_at || ''} 
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for Draft. Set future date for Scheduled.</p>
                                {errors.published_at && (<p className="text-red-500 text-xs mt-1">{errors.published_at[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Expiration Date (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    name="expires_at"
                                    value={formData.expires_at || ''} 
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration. Announcement will stop displaying after this date.</p>
                                {errors.expires_at && (<p className="text-red-500 text-xs mt-1">{errors.expires_at[0]}</p>)}
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" 
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} 
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : announcement ? 'Update Announcement' : 'Publish Announcement'}
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

const DeleteAnnouncementModal: React.FC<{
    announcement: Announcement;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ announcement, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(announcement.id);
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
                            Are you sure you want to delete the announcement: 
                            <strong className="text-red-700 block mt-1">
                                "{announcement.title}"
                            </strong>? 
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
                                {loading ? 'Deleting...' : 'Delete Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 🏠 MAIN ANNOUNCEMENTS PAGE
// ========================================================================

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        audience: '',
        status: '',
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [stats, setStats] = useState<AnnouncementStats>({
        total_announcements: 0,
        published_count: 0,
        draft_count: 0,
        scheduled_count: 0,
        today_count: 0,
        by_audience: [],
    });

    // Debounced effect for loading announcements based on filters
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadAnnouncements();
            // loadStats() is intentionally not debounced to be fetched quickly on initial load
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.audience, filters.status, filters.page, filters.per_page]);
    
    // Initial load for stats (no debounce)
    useEffect(() => {
        loadStats();
    }, []); 

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const apiFilters = {
                ...filters,
                audience: filters.audience as TargetAudience | undefined,
                status: filters.status as AnnouncementStatus | undefined,
            };
            // The service call is assumed to handle the request based on the API response structure provided earlier
            const response: AnnouncementsResponse = await adminAnnouncementService.getAnnouncements(apiFilters);
            
            if (response.success && Array.isArray(response.data)) {
                setAnnouncements(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                // Handle non-successful response gracefully
                throw new Error(response.message || 'Unknown error during announcement retrieval.');
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load announcements.';
            setNotification({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminAnnouncementService.getAnnouncementStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading announcement stats:', error);
        }
    };

    const handleCreate = () => {
        setSelectedAnnouncement(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleViewDetails = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setShowDetailsModal(true);
    };

    const handleSave = async (data: AnnouncementFormData) => {
        setValidationErrors({});
        try {
            let response: AnnouncementsResponse;
            
            if (selectedAnnouncement) {
                response = await adminAnnouncementService.updateAnnouncement(selectedAnnouncement.id, data);
                setNotification({ type: 'success', message: 'Announcement updated successfully!' });
            } else {
                response = await adminAnnouncementService.createAnnouncement(data);
                setNotification({ type: 'success', message: 'Announcement created successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadAnnouncements();
                loadStats();
                setValidationErrors({});
            } else {
                // Handle server validation errors in case the API returned them structured
                if (response.errors) {
                    setValidationErrors(response.errors);
                    setNotification({ type: 'error', message: response.message || 'Validation failed. Please check the form.' });
                } else {
                    throw new Error(response.message || 'Failed to save announcement.');
                }
            }
        } catch (error: any) {
            // This block handles errors thrown from the AdminAnnouncementService request wrapper
            // which often aggregates validation errors into a single message string.
            if (error.message && typeof error.message === 'string' && error.message.includes(':')) {
                const errorsObj: Record<string, string[]> = {};
                error.message.split(';').forEach((err: string) => {
                    const [field, msg] = err.split(':').map((s: string) => s.trim());
                    if (field && msg) {
                        errorsObj[field] = [msg];
                    }
                });
                setValidationErrors(errorsObj);
                setNotification({ type: 'error', message: 'Validation failed. Please check the form fields.' });
            } else {
                setNotification({ type: 'error', message: error.message || 'Failed to save announcement.' });
            }
            // Propagate error to AnnouncementModal to stop loading animation
            throw error; 
        }
    };
    
    const handleDelete = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            const response = await adminAnnouncementService.deleteAnnouncement(id);
            if (response.success) {
                setNotification({ type: 'success', message: response.message || 'Announcement deleted successfully!' });
                setShowDeleteModal(false);
                loadAnnouncements();
                loadStats();
            } else {
                throw new Error(response.message || 'Failed to delete announcement.');
            }
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete announcement.' });
            throw error; // Propagate error to DeleteAnnouncementModal to stop loading animation
        }
    };

    const renderAudienceTag = (audience: TargetAudience, color: string) => {
        const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border';
        const colors = {
            'purple': 'bg-purple-100 text-purple-800 border-purple-200',
            'blue': 'bg-blue-100 text-blue-800 border-blue-200',
            'green': 'bg-green-100 text-green-800 border-green-200',
            'orange': 'bg-orange-100 text-orange-800 border-orange-200',
            'gray': 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <span className={`${baseClass} ${colors[color as keyof typeof colors] || colors.gray}`}>
                <Users className="w-3 h-3 mr-1" />
                {audience}
            </span>
        );
    };

    const renderStatusTag = (status: AnnouncementStatus) => {
        const colors = {
            'Published': 'bg-green-100 text-green-800 border-green-200',
            'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
            'Scheduled': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
                {status}
            </span>
        );
    }
    
    const renderPagination = () => {
        const { current_page, last_page, total, per_page } = pagination;
        if (last_page <= 1) return null;
        
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(last_page, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{((current_page - 1) * per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(current_page * per_page, total)}</span> of{' '}
                    <span className="font-semibold">{total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={current_page === 1}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setFilters(prev => ({ ...prev, page }))}
                            className={`px-3 py-1 border rounded-lg transition-colors ${
                                page === current_page
                                    ? `${PRIMARY_COLOR_CLASS} text-white border-transparent`
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={current_page === last_page}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 sm:mb-6 md:mb-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">School Announcements</h1>
                                <p className="text-xs sm:text-sm text-gray-600">Create, manage, and publish announcements for all user groups.</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                className={`flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg text-xs sm:text-sm md:text-base`}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">New Announcement</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats - Mobile: Centered with icon below, Desktop: Icon on right */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{stats.total_announcements || 0}</p>
                                <div className={`p-2 sm:p-3 rounded-full ${LIGHT_BG_CLASS}`}>
                                    <BookOpen className={`w-5 w-5 sm:w-6 sm:h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_announcements || 0}</p>
                                </div>
                                <div className={`p-3 ${LIGHT_BG_CLASS} rounded-xl`}>
                                    <BookOpen className={`w-6 h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Published</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 sm:mb-3">{stats.published_count || 0}</p>
                                <div className="p-2 sm:p-3 bg-green-50 rounded-full">
                                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Published</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.published_count || 0}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Drafts</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-600 mb-2 sm:mb-3">{stats.draft_count || 0}</p>
                                <div className="p-2 sm:p-3 bg-gray-50 rounded-full">
                                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Drafts</p>
                                    <p className="text-3xl font-bold text-gray-600">{stats.draft_count || 0}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <BookOpen className="w-6 h-6 text-gray-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Scheduled</p>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-2 sm:mb-3">{stats.scheduled_count || 0}</p>
                                <div className="p-2 sm:p-3 bg-yellow-50 rounded-full">
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Scheduled</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.scheduled_count || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-xl">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="relative md:col-span-2">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                    placeholder="Search announcement title or content..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.audience}
                                    onChange={(e) => setFilters({...filters, audience: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Audience</option>
                                    {AUDIENCE_OPTIONS.map(audience => (
                                        <option key={audience} value={audience}>{audience}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Status</option>
                                    {STATUS_OPTIONS.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Title + Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">ID</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Title</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Content</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Audience</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Published</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Creator</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : announcements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Info className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No announcements found</p>
                                                    <p className="text-xs sm:text-sm">Create a new announcement or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        announcements.map((announcement) => (
                                            <tr key={announcement.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className="text-xs sm:text-sm font-mono text-gray-600">#{announcement.id}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{announcement.title}</div>
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="text-xs text-gray-500 line-clamp-2">{announcement.content.length > 80 ? announcement.content.substring(0, 77) + '...' : announcement.content}</div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {renderAudienceTag(announcement.target_audience, announcement.audience_badge_color)}
                                                            <span className="text-xs text-gray-600">
                                                                {announcement.published_at 
                                                                    ? new Date(announcement.published_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                        })
                                                                    : 'Draft'
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600">By: {announcement.creator?.name || 'Admin'}</div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: '200px' }}>
                                                        {announcement.content.length > 80 ? announcement.content.substring(0, 77) + '...' : announcement.content}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {renderAudienceTag(announcement.target_audience, announcement.audience_badge_color)}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {announcement.published_at 
                                                        ? new Date(announcement.published_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })
                                                        : <span className="text-gray-400 italic">Draft</span>
                                                    }
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {announcement.creator?.name || 'Admin'}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(announcement)}
                                                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(announcement)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Announcement"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(announcement)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Announcement"
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

                    {/* Modals */}
                    {showModal && (
                        <AnnouncementModal
                            announcement={selectedAnnouncement}
                            onClose={() => {
                                setShowModal(false);
                                setValidationErrors({});
                            }}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showDeleteModal && selectedAnnouncement && (
                        <DeleteAnnouncementModal
                            announcement={selectedAnnouncement}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={handleConfirmDelete}
                        />
                    )}

                    {showDetailsModal && selectedAnnouncement && (
                        <ViewDetailsModal
                            announcement={selectedAnnouncement}
                            onClose={() => setShowDetailsModal(false)}
                            onEdit={handleEdit}
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

export default Announcements;