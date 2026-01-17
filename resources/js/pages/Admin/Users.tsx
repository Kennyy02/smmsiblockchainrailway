import React, { useState, useEffect } from 'react';
import { User, Search, X, Eye, RefreshCw, Users as UsersIcon, ChevronDown, Mail } from 'lucide-react';
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
    role: 'admin' | 'teacher' | 'student' | 'parent';
    status: 'active' | 'inactive';
    level: number | null;
    program: string;
    grade: number | null;
    phone?: string;
    address?: string;
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
    sendingEmail?: boolean;
}> = ({ user, onClose, onSendAccountInfo, sendingEmail = false }) => {
    if (!user) return null;

    // Get phone and address from user or role-specific data
    const phone = user.phone || user.student?.phone || user.teacher?.phone || user.parent?.phone || 'N/A';
    const address = user.address || user.student?.address || user.parent?.address || 'N/A';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4 flex items-center justify-between`}>
                        <h3 className="text-lg font-semibold text-white">User Details</h3>
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
                        <button
                            onClick={() => onSendAccountInfo && onSendAccountInfo(user.id)}
                            disabled={sendingEmail}
                            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                        >
                            {sendingEmail ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4" />
                                    Send Account Information
                                </>
                            )}
                        </button>
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
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const getCsrfToken = (): string => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return csrfToken || '';
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
    };

    const handleSendAccountInfo = async (userId: number) => {
        setSendingEmail(true);
        try {
            const response = await fetch(`/api/users/${userId}/send-account-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            const data: ApiResponse<any> = await response.json();

            if (data.success) {
                // Show the generated password to admin
                const passwordMessage = data.generated_password 
                    ? `Account information sent! Generated Password: ${data.generated_password}`
                    : 'Account information sent successfully to user\'s email!';
                setNotification({ 
                    type: 'success', 
                    message: passwordMessage,
                    generatedPassword: data.generated_password // Store for potential display
                });
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

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        loadUsers();
    };

    const filteredUsers = users.filter(user => {
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
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Access</h1>
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                                                {selectedRole === 'all' ? (
                                                    <>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone Number</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Address</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Level</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Program</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Grade</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                                    </>
                                                )}
                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredUsers.map((user) => {
                                                const phone = user.phone || user.student?.phone || user.teacher?.phone || user.parent?.phone || 'N/A';
                                                const address = user.address || user.student?.address || user.parent?.address || 'N/A';
                                                
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                        </td>
                                                        {selectedRole === 'all' ? (
                                                            <>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{phone}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{address}</div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                                        {user.level ? formatGradeLevel(user.level) : 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">{user.program || 'N/A'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                                        {user.grade ? formatGradeLevel(user.grade) : 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
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
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => handleView(user)}
                                                                className={`inline-flex items-center px-3 py-1.5 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-colors`}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
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
                            }}
                            onSendAccountInfo={handleSendAccountInfo}
                            sendingEmail={sendingEmail}
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

