import React, { useState, useEffect } from 'react';
import { User, Search, X, Eye, RefreshCw, Users as UsersIcon, ChevronDown, Mail } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// --- MARITIME THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]'; // Deep Navy Blue
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]'; // Darker Navy
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10'; // Light Blue/Navy Tint
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]'; // Very Light Blue

interface UserData {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';
    status: 'active' | 'inactive';
    level: number | null;
    program: string;
    grade: number | null;
    phone?: string;
    address?: string;
    password_changed_at?: string | null;
    student?: {
        phone?: string;
        address?: string;
        parents?: Array<{
            id: number;
            first_name: string;
            last_name: string;
            middle_name?: string;
            full_name?: string;
            phone?: string;
            address?: string;
        }>;
    };
    teacher?: {
        phone?: string;
    };
    parent?: {
        phone?: string;
        address?: string;
        students?: Array<{
            id: number;
            first_name: string;
            last_name: string;
            middle_name?: string;
            full_name?: string;
            phone?: string;
            address?: string;
        }>;
    };
    created_at: string;
    updated_at: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
    generatedPassword?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Format grade level display
const formatGradeLevel = (grade: number | null): string => {
    if (!grade) return 'N/A';
    if (grade >= 13) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return yearNames[grade - 13] || `${grade - 12}th Year`;
    }
    return `Grade ${grade}`;
};

// Notification Component
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

// View User Modal
const ViewUserModal: React.FC<{
    user: UserData | null;
    onClose: () => void;
    onSendAccountInfo?: (userId: number) => Promise<void>;
    onSendReminder?: (userId: number) => Promise<void>;
    sendingEmail?: boolean;
    sendingReminder?: boolean;
    generatedPassword?: string | null;
}> = ({ user, onClose, onSendAccountInfo, onSendReminder, sendingEmail = false, sendingReminder = false, generatedPassword = null }) => {
    if (!user) return null;

    // Get phone and address from user or role-specific data
    const phone = user.phone || user.student?.phone || user.teacher?.phone || user.parent?.phone || 'N/A';
    const address = user.address || user.student?.address || user.parent?.address || 'N/A';
    
    // Get password status
    const passwordChanged = user.password_changed_at !== null && user.password_changed_at !== undefined;

    // Get role display name
    const getRoleDisplay = () => {
        if (!user.role) return 'User';
        if (user.role === 'super_admin') return 'Super Admin';
        return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    };

    // Get role badge color
    const getRoleBadgeColor = () => {
        switch (user.role) {
            case 'super_admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'admin':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'teacher':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'student':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'parent':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay with dark blur */}
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header with Role Badge */}
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-white">User Details</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                                {getRoleDisplay()}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 bg-white dark:bg-gray-800">
                        <div className="space-y-4">
                            {/* Basic Information */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">User Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password Status</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${passwordChanged ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className={`text-sm ${passwordChanged ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {passwordChanged ? 'Changed' : 'Not Yet Changed'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student's Parent Information */}
                            {user.role === 'student' && user.student?.parents && user.student.parents.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parent Information</h4>
                                    {user.student.parents.map((parent, index) => (
                                        <div key={parent.id || index} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Parent Name</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {parent.full_name || `${parent.first_name} ${parent.middle_name ? parent.middle_name + ' ' : ''}${parent.last_name}`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{parent.phone || 'N/A'}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{parent.address || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Parent's Child Information */}
                            {user.role === 'parent' && user.parent?.students && user.parent.students.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Child Information</h4>
                                    {user.parent.students.map((child, index) => (
                                        <div key={child.id || index} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Child Name</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        {child.full_name || `${child.first_name} ${child.middle_name ? child.middle_name + ' ' : ''}${child.last_name}`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{child.phone || 'N/A'}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</label>
                                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{child.address || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                        <div className="flex gap-3">
                            <button
                                onClick={() => onSendAccountInfo && onSendAccountInfo(user.id)}
                                disabled={sendingEmail || sendingReminder}
                                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                            >
                                {sendingEmail ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        Reset Password
                                    </>
                                )}
                            </button>
                            {/* Show Remind button only if password hasn't been changed */}
                            {!user.password_changed_at && onSendReminder && (
                                <button
                                    onClick={() => onSendReminder(user.id)}
                                    disabled={sendingEmail || sendingReminder}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                >
                                    {sendingReminder ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            Remind
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-colors`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Users Component
const Users: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const getCsrfToken = (): string => {
        // Try multiple sources for CSRF token
        let csrfToken: string | null = null;
        
        // 1. Try meta tag first
        csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
        
        // 2. Try Inertia page props
        if (!csrfToken && typeof window !== 'undefined') {
            try {
                const inertiaData = (window as any).__INERTIA_DATA__;
                if (inertiaData?.page?.props?.csrf_token) {
                    csrfToken = inertiaData.page.props.csrf_token;
                } else if ((window as any).Inertia?.page?.props?.csrf_token) {
                    csrfToken = (window as any).Inertia.page.props.csrf_token;
                }
            } catch (e) {
                console.warn('Could not retrieve CSRF token from Inertia props:', e);
            }
        }
        
        // 3. Try Laravel's default token name
        if (!csrfToken) {
            const tokenInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
            if (tokenInput) {
                csrfToken = tokenInput.value;
            }
        }
        
        // 4. Try XSRF-TOKEN cookie
        if (!csrfToken) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'XSRF-TOKEN') {
                    csrfToken = decodeURIComponent(value);
                    break;
                }
            }
        }
        
        if (!csrfToken) {
            console.error('CSRF token not found. Please refresh the page.');
            return '';
        }
        
        return csrfToken;
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('per_page', pagination.per_page.toString());
            params.append('page', pagination.current_page.toString());
            
            if (selectedRole !== 'all') {
                params.append('role', selectedRole);
            }
            
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await fetch(`/api/users?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            const data: ApiResponse<{ data: UserData[]; current_page: number; last_page: number; per_page: number; total: number }> = await response.json();

            if (data.success) {
                setUsers(data.data.data);
                setPagination({
                    current_page: data.data.current_page,
                    last_page: data.data.last_page,
                    per_page: data.data.per_page,
                    total: data.data.total,
                });
            } else {
                setNotification({ type: 'error', message: data.message || 'Failed to load users' });
            }
        } catch (error: any) {
            console.error('Error loading users:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [selectedRole, pagination.current_page]);

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleView = (user: UserData) => {
        setSelectedUser(user);
        setShowViewModal(true);
        // Clear generated password when viewing a different user
        setGeneratedPassword(null);
    };

    const handleSendAccountInfo = async (userId: number) => {
        setSendingEmail(true);
        try {
            // Fetch fresh CSRF token from API if available
            let csrfToken = getCsrfToken();
            
            // If token is empty, try to fetch it from the API
            if (!csrfToken) {
                try {
                    const tokenResponse = await fetch('/api/csrf-token', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'include',
                    });
                    
                    if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        if (tokenData.success && tokenData.csrf_token) {
                            csrfToken = tokenData.csrf_token;
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch CSRF token from API:', e);
                }
            }

            const response = await fetch(`/api/users/${userId}/send-account-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            // If we get a 419, try refreshing the token and retry once
            if (response.status === 419) {
                try {
                    const tokenResponse = await fetch('/api/csrf-token', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'include',
                    });
                    
                    if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        if (tokenData.success && tokenData.csrf_token) {
                            // Retry with fresh token
                            const retryResponse = await fetch(`/api/users/${userId}/send-account-info`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRF-TOKEN': tokenData.csrf_token,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                credentials: 'include',
                            });
                            
                            const data: ApiResponse<any> = await retryResponse.json();
                            if (!retryResponse.ok || !data.success) {
                                setNotification({ type: 'error', message: data.message || 'Failed to send account information. Please refresh the page and try again.' });
                                setSendingEmail(false);
                                return;
                            }
                            
                            // Success on retry - show notification
                            setNotification({ 
                                type: 'success', 
                                message: 'Account information sent!'
                            });
                            // Store generated password to display in modal
                            if (data.generated_password) {
                                setGeneratedPassword(data.generated_password);
                            }
                            setSendingEmail(false);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Failed to refresh CSRF token:', e);
                }
                
                // If retry failed, show error
                setNotification({ type: 'error', message: 'Session expired. Please refresh the page and try again.' });
                setSendingEmail(false);
                return;
            }

            const data: ApiResponse<any> = await response.json();

            if (data.success) {
                // Show notification without password
                setNotification({ 
                    type: 'success', 
                    message: 'Account information sent!'
                });
                // Store generated password to display in modal
                if (data.generated_password) {
                    setGeneratedPassword(data.generated_password);
                    // Update selectedUser to reflect that password_changed_at is now null
                    if (selectedUser && selectedUser.id === userId) {
                        setSelectedUser({
                            ...selectedUser,
                            password_changed_at: null
                        });
                    }
                }
                // Reload user data to get updated password_changed_at status
                if (selectedUser) {
                    loadUsers();
                }
            } else {
                setNotification({ type: 'error', message: data.message || 'Failed to send account information' });
            }
        } catch (error: any) {
            console.error('Error sending account info:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to send account information' });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSendReminder = async (userId: number) => {
        setSendingReminder(true);
        try {
            // Fetch fresh CSRF token from API if available
            let csrfToken = getCsrfToken();
            
            // If token is empty, try to fetch it from the API
            if (!csrfToken) {
                try {
                    const tokenResponse = await fetch('/api/csrf-token', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'include',
                    });
                    
                    if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        if (tokenData.success && tokenData.csrf_token) {
                            csrfToken = tokenData.csrf_token;
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch CSRF token from API:', e);
                }
            }

            const response = await fetch(`/api/users/${userId}/send-reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            // If we get a 419, try refreshing the token and retry once
            if (response.status === 419) {
                try {
                    const tokenResponse = await fetch('/api/csrf-token', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'include',
                    });
                    
                    if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        if (tokenData.success && tokenData.csrf_token) {
                            // Retry with fresh token
                            const retryResponse = await fetch(`/api/users/${userId}/send-reminder`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRF-TOKEN': tokenData.csrf_token,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                credentials: 'include',
                            });
                            
                            const data: ApiResponse<any> = await retryResponse.json();
                            if (!retryResponse.ok || !data.success) {
                                setNotification({ type: 'error', message: data.message || 'Failed to send reminder. Please refresh the page and try again.' });
                                setSendingReminder(false);
                                return;
                            }
                            
                            // Success on retry
                            setNotification({ 
                                type: 'success', 
                                message: 'Reminder sent successfully!'
                            });
                            setSendingReminder(false);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Failed to refresh CSRF token:', e);
                }
                
                // If retry failed, show error
                setNotification({ type: 'error', message: 'Session expired. Please refresh the page and try again.' });
                setSendingReminder(false);
                return;
            }

            const data: ApiResponse<any> = await response.json();

            if (data.success) {
                setNotification({ 
                    type: 'success', 
                    message: 'Reminder sent successfully!'
                });
            } else {
                setNotification({ type: 'error', message: data.message || 'Failed to send reminder' });
            }
        } catch (error: any) {
            console.error('Error sending reminder:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to send reminder' });
        } finally {
            setSendingReminder(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        loadUsers();
    };

    const filteredUsers = users.filter(user => {
        // Exclude super_admin users
        if (user.role === 'super_admin') return false;
        
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.program && user.program.toLowerCase().includes(search))
        );
    });

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <UsersIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Password Management</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and view all system users</p>
                            </div>
                        </div>
                        <button
                            onClick={loadUsers}
                            className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* User Access Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    User Access
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] appearance-none cursor-pointer pr-10"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="admin">Admin</option>
                                        <option value="teacher">Teachers</option>
                                        <option value="parent">Parents</option>
                                        <option value="student">Students</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Search
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by name, email, or program..."
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className={`px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-colors`}
                                    >
                                        <Search className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003366]"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-12 text-center">
                                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No users found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className={`${PRIMARY_COLOR_CLASS}`}>
                                            <tr>
                                                <th className="px-2 py-4 md:px-6 md:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                                                {selectedRole === 'all' ? (
                                                    <>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone Number</th>
                                                        <th className="px-2 py-4 md:px-6 md:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Password Status</th>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Role</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Level</th>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Program</th>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Grade</th>
                                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                                    </>
                                                )}
                                                <th className="px-2 py-4 md:px-6 md:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredUsers.map((user) => {
                                                const phone = user.phone || user.student?.phone || user.teacher?.phone || user.parent?.phone || 'N/A';
                                                const passwordChanged = user.password_changed_at !== null && user.password_changed_at !== undefined;
                                                
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-2 py-4 md:px-6 md:py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                        </td>
                                                        {selectedRole === 'all' ? (
                                                            <>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                                                                </td>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{phone}</div>
                                                                </td>
                                                                <td className="px-2 py-4 md:px-6 md:py-4 whitespace-nowrap">
                                                                    <div className="flex items-center justify-center md:justify-start gap-1 md:gap-2">
                                                                        <span className={`h-2 w-2 rounded-full ${passwordChanged ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                        <span className={`hidden md:inline text-sm ${passwordChanged ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                            {passwordChanged ? 'Changed' : 'Not Yet Changed'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        user.role === 'super_admin'
                                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                            : user.role === 'admin' 
                                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                            : user.role === 'teacher'
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                            : user.role === 'student'
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                            : user.role === 'parent'
                                                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                    }`}>
                                                                        {user.role ? (user.role === 'super_admin' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'N/A'}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                                        {user.level ? formatGradeLevel(user.level) : 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{user.program || 'N/A'}</div>
                                                                </td>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                                        {user.grade ? formatGradeLevel(user.grade) : 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        user.status === 'active' 
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    }`}>
                                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-2 py-4 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => handleView(user)}
                                                                className={`inline-flex items-center px-2 py-2 md:px-3 md:py-1.5 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-colors`}
                                                            >
                                                                <Eye className="h-4 w-4 md:mr-1" />
                                                                <span className="hidden md:inline">View</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} users
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                                disabled={pagination.current_page === 1}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                                disabled={pagination.current_page === pagination.last_page}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* View Modal */}
                    {showViewModal && (
                        <ViewUserModal
                            user={selectedUser}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedUser(null);
                                setGeneratedPassword(null); // Clear generated password when closing modal
                            }}
                            onSendAccountInfo={handleSendAccountInfo}
                            onSendReminder={handleSendReminder}
                            sendingEmail={sendingEmail}
                            sendingReminder={sendingReminder}
                            generatedPassword={generatedPassword}
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

export default Users;

