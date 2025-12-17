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
    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (csrfToken) {
            defaultHeaders['X-CSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: 'same-origin',
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;
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
     * Add admin notes to a message
     */
    async addNotes(id: number, notes: string): Promise<SingleResponse<ContactMessage>> {
        return this.updateMessage(id, { admin_notes: notes });
    }
}

export const adminContactService = new AdminContactService();
export default adminContactService;

