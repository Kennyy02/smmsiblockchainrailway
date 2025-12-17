// ============================================
// Contact Message Service
// Handles API communication for contact messages
// ============================================

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
    read_at: string | null;
    replied_at: string | null;
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
    admin_notes?: string | null;
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

export interface ContactMessageFilters {
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

class AdminContactMessageService {
    private baseURL = '/api/contact-messages';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
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
            const errorMessage = data.message || data.errors 
                ? Object.values(data.errors || {}).flat().join(', ') 
                : 'Request failed';
            throw new Error(errorMessage);
        }

        return data;
    }

    // ========================================================================
    // PUBLIC METHOD - Submit contact form (no auth required)
    // ========================================================================
    
    async submitContactForm(formData: ContactMessageFormData): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(this.baseURL, {
            method: 'POST',
            body: JSON.stringify(formData),
        });
    }

    // ========================================================================
    // ADMIN METHODS - Require authentication
    // ========================================================================

    async getMessages(filters: ContactMessageFilters = {}): Promise<ApiResponse<ContactMessage[]>> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });

        const url = `${this.baseURL}${params.toString() ? '?' + params.toString() : ''}`;
        return this.request<ContactMessage[]>(url);
    }

    async getMessage(id: number): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(`${this.baseURL}/${id}`);
    }

    async updateMessage(id: number, data: ContactMessageUpdateData): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(`${this.baseURL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteMessage(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/${id}`, {
            method: 'DELETE',
        });
    }

    async getStats(): Promise<ApiResponse<ContactMessageStats>> {
        return this.request<ContactMessageStats>(`${this.baseURL}/stats`);
    }

    async markAsRead(id: number): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(`${this.baseURL}/${id}/mark-read`, {
            method: 'POST',
        });
    }

    async markAsReplied(id: number): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(`${this.baseURL}/${id}/mark-replied`, {
            method: 'POST',
        });
    }

    async archive(id: number): Promise<ApiResponse<ContactMessage>> {
        return this.request<ContactMessage>(`${this.baseURL}/${id}/archive`, {
            method: 'POST',
        });
    }
}

export const adminContactMessageService = new AdminContactMessageService();
export default adminContactMessageService;

