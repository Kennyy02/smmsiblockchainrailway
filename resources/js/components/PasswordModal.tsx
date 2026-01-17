import React, { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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

            const response = await fetch('/api/users/verify-access-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({ password }),
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
                            const retryResponse = await fetch('/api/users/verify-access-password', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRF-TOKEN': tokenData.csrf_token,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ password }),
                            });
                            
                            const data = await retryResponse.json();
                            if (data.success) {
                                setPassword('');
                                onSuccess();
                                onClose();
                                setLoading(false);
                                return;
                            } else {
                                setError(data.message || 'Incorrect password. Please try again.');
                                setPassword('');
                                setLoading(false);
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to refresh CSRF token:', e);
                }
                
                // If retry failed, show error
                setError('Session expired. Please refresh the page and try again.');
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setPassword('');
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Incorrect password. Please try again.');
                setPassword('');
            }
        } catch (error: any) {
            setError('Failed to verify password. Please try again.');
            console.error('Password verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay with dark blur */}
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                    {/* Header */}
                    <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-white" />
                            <h3 className="text-lg font-semibold text-white">Password Required</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-4 bg-white dark:bg-gray-800">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Please enter the password to access User Password Management.
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter password"
                                    autoFocus
                                    disabled={loading}
                                />
                                {error && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !password}
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;

