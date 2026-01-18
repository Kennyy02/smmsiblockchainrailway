// ============================================
// Admin Contact Message Service
// Handles API calls for contact message management
// ============================================

const baseURL = '/api';

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'unread' | 'read' | 'replied' | 'archived';
    admin_notes: string | null;
    replied_by: number | null;
    replied_by_user?: {
        id: number;
        name: string;
    };
    replied_at: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactMessageFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface ContactMessageUpdateData {
    status?: 'unread' | 'read' | 'replied' | 'archived';
    admin_notes?: string;
}

export interface ContactMessageFilters {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ContactMessageStats {
    total: number;
    unread: number;
    read: number;
    replied: number;
    archived: number;
    today: number;
    this_week: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface SingleResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

class AdminContactService {
    private getCsrfToken(): string {
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
        
        if (!csrfToken) {
            console.error('CSRF token not found. Please refresh the page.');
            throw new Error('CSRF token not found. Please refresh the page.');
        }
        
        return csrfToken;
    }

    private async refreshCsrfToken(): Promise<string> {
        try {
            console.log('Fetching fresh CSRF token from /api/csrf-token...');
            const response = await fetch(`${baseURL}/csrf-token`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                console.error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch new CSRF token: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.csrf_token) {
                console.log('Successfully retrieved fresh CSRF token');
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', data.csrf_token);
                    console.log('Updated meta tag with new CSRF token');
                }
                return data.csrf_token;
            }
            console.error('Invalid CSRF token response:', data);
            throw new Error('Invalid CSRF token response');
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            throw new Error('Failed to refresh session. Please refresh the page manually.');
        }
    }

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<T> {
        let csrfToken = this.getCsrfToken();
        
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
        };

        const makeRequest = async (token: string) => {
            return fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    'X-CSRF-TOKEN': token,
                    ...options.headers,
                },
                credentials: 'same-origin',
            });
        };

        try {
            let response = await makeRequest(csrfToken);
            
            // Handle 419 CSRF token mismatch - refresh token and retry
            if (response.status === 419 && retryOn419) {
                console.warn('CSRF token mismatch (419). Attempting to refresh token and retry...');
                try {
                    csrfToken = await this.refreshCsrfToken();
                    response = await makeRequest(csrfToken);
                } catch (refreshError) {
                    console.error('Failed to refresh CSRF token:', refreshError);
                    throw new Error('CSRF token mismatch. Your session may have expired. Please refresh the page and try again.');
                }
            }

            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                if (response.status >= 400) {
                    throw new Error(`Request failed with status ${response.status}: ${text.substring(0, 100)}`);
                }
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(`Invalid response format: ${text.substring(0, 100)}`);
                }
            }

            if (!response.ok) {
                const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error: any) {
            if (error.message && error.message.includes('CSRF')) {
                throw error;
            }
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }

    // ========================================================================
    // PUBLIC METHODS (No auth required)
    // ========================================================================

    /**
     * Submit a contact message (public - no auth required)
     */
    async submitContactForm(formData: ContactMessageFormData): Promise<SingleResponse<ContactMessage>> {
        return this.request<SingleResponse<ContactMessage>>(`${baseURL}/contact-messages`, {
            method: 'POST',
            body: JSON.stringify(formData),
        });
    }

    // ========================================================================
    // ADMIN METHODS (Auth required)
    // ========================================================================

    /**
     * Get all contact messages with filters
     */
    async getMessages(filters: ContactMessageFilters = {}): Promise<PaginatedResponse<ContactMessage>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
        return this.request<PaginatedResponse<ContactMessage>>(`${baseURL}/contact-messages?${params.toString()}`);
    }

    /**
     * Get a single contact message
     */
    async getMessage(id: number): Promise<SingleResponse<ContactMessage>> {
        return this.request<SingleResponse<ContactMessage>>(`${baseURL}/contact-messages/${id}`);
    }

    /**
     * Update a contact message (status, admin notes)
     */
    async updateMessage(id: number, data: ContactMessageUpdateData): Promise<SingleResponse<ContactMessage>> {
        return this.request<SingleResponse<ContactMessage>>(`${baseURL}/contact-messages/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a contact message
     */
    async deleteMessage(id: number): Promise<SingleResponse<null>> {
        return this.request<SingleResponse<null>>(`${baseURL}/contact-messages/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get contact message statistics
     */
    async getStats(): Promise<SingleResponse<ContactMessageStats>> {
        return this.request<SingleResponse<ContactMessageStats>>(`${baseURL}/contact-messages/stats`);
    }

    /**
     * Mark message as read
     */
    async markAsRead(id: number): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { status: 'read' });
    }

    /**
     * Mark message as replied
     */
    async markAsReplied(id: number): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { status: 'replied' });
    }

    /**
     * Archive a message
     */
    async archiveMessage(id: number): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { status: 'archived' });
    }

    /**
     * Unarchive a message (set back to unread)
     */
    async unarchiveMessage(id: number): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { status: 'unread' });
    }

    /**
     * Add admin notes to a message
     */
    async addNotes(id: number, notes: string): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { admin_notes: notes });
    }
}

export const adminContactService = new AdminContactService();
export default adminContactService;

