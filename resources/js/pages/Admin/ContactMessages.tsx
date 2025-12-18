// ============================================
// FILE: pages/Admin/ContactMessages.tsx
// Contact Messages Management - Admin Dashboard
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Mail,
    MailOpen,
    MessageSquare,
    Search,
    Filter,
    RefreshCw,
    Eye,
    Trash2,
    Archive,
    CheckCircle,
    Clock,
    X,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    Tag,
    Send,
    MailCheck,
    Inbox,
} from 'lucide-react';
import { adminContactService, ContactMessage, ContactMessageStats, ContactMessageFilters } from '../../../services/AdminContactService';

// Theme Colors
const PRIMARY_COLOR_CLASS = 'bg-blue-900';
const HOVER_COLOR_CLASS = 'hover:bg-blue-800';
const LIGHT_BG_CLASS = 'bg-blue-50';
const TEXT_COLOR_CLASS = 'text-blue-900';
const RING_COLOR_CLASS = 'focus:ring-blue-500';

// ========================================================================
// NOTIFICATION COMPONENT
// ========================================================================
interface NotificationProps {
    type: 'success' | 'error' | 'info';
    message: string;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3`}>
            {type === 'success' && <CheckCircle className="w-5 h-5" />}
            {type === 'error' && <AlertCircle className="w-5 h-5" />}
            {type === 'info' && <Mail className="w-5 h-5" />}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ========================================================================
// MESSAGE DETAIL MODAL
// ========================================================================
interface MessageDetailModalProps {
    message: ContactMessage;
    onClose: () => void;
    onStatusChange: (id: number, status: 'read' | 'replied' | 'archived' | 'unread') => void;
    onDelete: (id: number) => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({ message, onClose, onStatusChange, onDelete }) => {
    const [notes, setNotes] = useState(message.admin_notes || '');
    const [saving, setSaving] = useState(false);

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            await adminContactService.addNotes(message.id, notes);
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            unread: 'bg-red-100 text-red-800',
            read: 'bg-yellow-100 text-yellow-800',
            replied: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${message.status === 'unread' ? 'bg-red-100' : LIGHT_BG_CLASS}`}>
                                    {message.status === 'unread' ? (
                                        <Mail className="w-6 h-6 text-red-600" />
                                    ) : (
                                        <MailOpen className={`w-6 h-6 ${TEXT_COLOR_CLASS}`} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{message.subject}</h2>
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(message.status)}`}>
                                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Sender Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                                <User className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">From</p>
                                    <p className="font-semibold text-gray-900">{message.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                                <Mail className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <a href={`mailto:${message.email}`} className="font-semibold text-blue-600 hover:underline">
                                        {message.email}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Received</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(message.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                                <Tag className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Subject Category</p>
                                    <p className="font-semibold text-gray-900">{message.subject}</p>
                                </div>
                            </div>
                        </div>

                        {/* Message Content */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Message</h3>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-800 whitespace-pre-wrap">{message.message}</p>
                            </div>
                        </div>

                        {/* Reply Info */}
                        {message.replied_at && (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-center space-x-2 text-green-700">
                                    <MailCheck className="w-5 h-5" />
                                    <span className="font-medium">
                                        Replied by {message.replied_by_user?.name || 'Admin'} on{' '}
                                        {new Date(message.replied_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Admin Notes */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add internal notes about this message..."
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className={`mt-2 px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} disabled:opacity-50`}
                            >
                                {saving ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                        <div className="flex flex-wrap gap-3 justify-between">
                            <div className="flex flex-wrap gap-2">
                                {message.status !== 'replied' && message.status !== 'archived' && (
                                    <button
                                        onClick={() => onStatusChange(message.id, 'replied')}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <MailCheck className="w-4 h-4" />
                                        <span>Mark as Replied</span>
                                    </button>
                                )}
                                {message.status === 'archived' ? (
                                    <button
                                        onClick={() => onStatusChange(message.id, 'unread')}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Inbox className="w-4 h-4" />
                                        <span>Unarchive</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStatusChange(message.id, 'archived')}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span>Archive</span>
                                    </button>
                                )}
                                <a
                                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(message.email)}&su=${encodeURIComponent('Re: ' + message.subject)}&body=${encodeURIComponent(`Dear ${message.name},\n\nThank you for contacting Southern Mindoro Maritime School.\n\nRegarding your inquiry about "${message.subject}":\n\n\n\nBest regards,\nSouthern Mindoro Maritime School\nBlockchain Grading System Support`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Reply via Gmail</span>
                                </a>
                            </div>
                            <button
                                onClick={() => onDelete(message.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================
const ContactMessages: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [stats, setStats] = useState<ContactMessageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [viewMode, setViewMode] = useState<'messages' | 'archived'>('messages'); // New state for view toggle
    
    // Filters
    const [filters, setFilters] = useState<ContactMessageFilters>({
        page: 1,
        per_page: 15,
        status: viewMode === 'archived' ? 'archived' : '',
        search: '',
        sort_by: 'created_at',
        sort_order: 'desc',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    // Update filters when view mode changes
    useEffect(() => {
        if (viewMode === 'archived') {
            setFilters(prev => ({ ...prev, status: 'archived', page: 1 }));
        } else {
            // In messages view, show all except archived
            setFilters(prev => ({ ...prev, status: '', page: 1 }));
        }
    }, [viewMode]);

    // Load messages
    const loadMessages = useCallback(async () => {
        setLoading(true);
        try {
            // Create filters copy
            const loadFilters = { ...filters };
            
            // In messages view, we need to exclude archived messages
            if (viewMode === 'messages' && !loadFilters.status) {
                // We'll filter out archived on the frontend since backend doesn't have "not archived" filter
                const response = await adminContactService.getMessages(loadFilters);
                const filteredMessages = response.data.filter(msg => msg.status !== 'archived');
                setMessages(filteredMessages);
                // Adjust pagination total
                setPagination({
                    ...response.pagination,
                    total: filteredMessages.length
                });
            } else {
                const response = await adminContactService.getMessages(loadFilters);
                setMessages(response.data);
                setPagination(response.pagination);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load messages' });
        } finally {
            setLoading(false);
        }
    }, [filters, viewMode]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const response = await adminContactService.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Handle view message
    const handleViewMessage = async (message: ContactMessage) => {
        try {
            const response = await adminContactService.getMessage(message.id);
            setSelectedMessage(response.data);
            // Refresh list to update read status
            loadMessages();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load message' });
        }
    };

    // Handle status change
    const handleStatusChange = async (id: number, status: 'read' | 'replied' | 'archived' | 'unread') => {
        try {
            await adminContactService.updateMessage(id, { status });
            const actionText = status === 'unread' ? 'unarchived' : `marked as ${status}`;
            setNotification({ type: 'success', message: `Message ${actionText}` });
            setSelectedMessage(null);
            loadMessages();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to update message' });
        }
    };

    // Handle delete
    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        try {
            await adminContactService.deleteMessage(id);
            setNotification({ type: 'success', message: 'Message deleted successfully' });
            setSelectedMessage(null);
            loadMessages();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete message' });
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            unread: 'bg-red-100 text-red-800',
            read: 'bg-yellow-100 text-yellow-800',
            replied: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        }
        return date.toLocaleDateString();
    };

    return (
        <AppLayout>
            <Head title="Contact Messages" />

            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Inbox className={`w-8 h-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            Contact Messages
                        </h1>
                        <p className="text-gray-600 mt-1">Manage messages from the contact form</p>
                    </div>
                    <button
                        onClick={() => { loadMessages(); loadStats(); }}
                        className={`flex items-center space-x-2 px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS}`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-red-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Unread</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                                </div>
                                <Mail className="w-8 h-8 text-red-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-yellow-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Read</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.read}</p>
                                </div>
                                <MailOpen className="w-8 h-8 text-yellow-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Replied</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
                                </div>
                                <MailCheck className="w-8 h-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Archived</p>
                                    <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
                                </div>
                                <Archive className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Today</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">This Week</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.this_week}</p>
                                </div>
                                <Clock className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* View Toggle Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setViewMode('messages')}
                        className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all ${
                            viewMode === 'messages'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Messages
                    </button>
                    <button
                        onClick={() => setViewMode('archived')}
                        className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all ${
                            viewMode === 'archived'
                                ? 'bg-gray-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <Archive className="w-5 h-5 mr-2" />
                        Archived
                        {stats && stats.archived > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                {stats.archived}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or message..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <div className="relative">
                            {/* Status Filter - Only show if not in archived view */}
                            {viewMode === 'messages' ? (
                                <>
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                    >
                                        <option value="">All Status</option>
                                        <option value="unread">Unread</option>
                                        <option value="read">Read</option>
                                        <option value="replied">Replied</option>
                                    </select>
                                </>
                            ) : (
                                <div className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium">
                                    <Archive className="inline w-4 h-4 mr-2" />
                                    Archived Messages
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No messages found</p>
                            <p className="text-gray-400 text-sm">Messages from the contact form will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    onClick={() => handleViewMessage(message)}
                                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        message.status === 'unread' ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg mr-4 ${message.status === 'unread' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                        {message.status === 'unread' ? (
                                            <Mail className="w-5 h-5 text-red-600" />
                                        ) : (
                                            <MailOpen className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold truncate ${message.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {message.name}
                                            </p>
                                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(message.status)}`}>
                                                {message.status}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${message.status === 'unread' ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{message.message}</p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex-shrink-0 text-right ml-4">
                                        <p className="text-sm text-gray-500">{formatDate(message.created_at)}</p>
                                        <p className="text-xs text-gray-400">{message.email}</p>
                                    </div>

                                    {/* Action */}
                                    <div className="ml-4">
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total > pagination.per_page && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} messages
                            </p>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                                    disabled={pagination.current_page === 1}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-3 py-1 text-sm font-medium">
                                    {pagination.current_page} / {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <MessageDetailModal
                    message={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            )}
        </AppLayout>
    );
};

export default ContactMessages;
