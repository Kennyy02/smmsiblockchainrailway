// ========================================================================
// 🔐 ADMIN MESSAGE SERVICE - School Management System
// Handles API calls for Private Messaging/Conversations
// ========================================================================

// Reusing general interfaces for consistency
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: any;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Minimal User interface for relationships (sender/receiver)
export interface MinimalUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

// 📋 MESSAGE INTERFACE DEFINITIONS

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    time_ago: string; // Computed attribute
    preview: string; // Computed attribute
    status: 'read' | 'unread'; // Computed attribute

    // Relationships
    sender: MinimalUser;
    receiver: MinimalUser;
}

export interface MessageFormData {
    receiver_id: number;
    message: string;
}

// Data structure for the main index endpoint (conversation list)
export interface ConversationThread {
    other_user_id: number;
    last_message_at: string;
    unread_count: number;
    other_user: MinimalUser; // Eager loaded relationship
    last_message_preview: string; // Computed attribute
}

export interface MessageStats {
    total_sent: number;
    total_received: number;
    unread_count: number;
    recent_messages: number;
    total_messages: number;
}

export interface ConversationsResponse extends ApiResponse<ConversationThread[]> {
    pagination?: PaginationData;
}

// 🛠️ ADMIN MESSAGE SERVICE CLASS

class AdminMessageService {
    private baseURL = ''; 

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
            },
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const contentType = response.headers.get('content-type');
            let data: any;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Unexpected response format from server');
            }

            if (!response.ok) {
                if (data.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('; ');
                    throw new Error(errorMessages || data.message || `Request failed with status ${response.status}`);
                }
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('❌ REQUEST ERROR:', error);
            throw error;
        }
    }

    // 💬 MESSAGE ENDPOINTS
    
    /**
     * Get a list of conversation threads (grouped by other user)
     */
    async getConversations(params: {
        page?: number;
        per_page?: number;
        search?: string; // Search on other user's name/email
    } = {}): Promise<ConversationsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        // Assuming the index route returns conversation threads as per MessageController.php snippet
        return this.request<ConversationThread[]>(`${this.baseURL}/messages?${searchParams.toString()}`) as Promise<ConversationsResponse>;
    }

    /**
     * Get all messages in a specific conversation thread with another user
     */
    async getMessageThread(otherUserId: number, params: {
        page?: number;
        per_page?: number;
    } = {}): Promise<ApiResponse<Message[]>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        // Assuming a dedicated endpoint for fetching a conversation thread
        return this.request<Message[]>(`${this.baseURL}/messages/thread/${otherUserId}?${searchParams.toString()}`);
    }

    /**
     * Send a new message
     */
    async sendMessage(messageData: MessageFormData): Promise<ApiResponse<Message>> {
        return this.request<Message>(`${this.baseURL}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }

    /**
     * Mark all messages in a conversation as read
     */
    async markThreadAsRead(otherUserId: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/messages/read/${otherUserId}`, {
            method: 'PUT',
        });
    }

    /**
     * Get message statistics for the current user
     */
    async getMessageStats(): Promise<ApiResponse<MessageStats>> {
        return this.request<MessageStats>(`${this.baseURL}/messages/stats`);
    }
    
    /**
     * Helper to fetch minimal list of users for composing new messages
     */
    async getAllUsersMinimal(): Promise<ApiResponse<MinimalUser[]>> {
        // Assuming an endpoint to fetch a minimal list of all users for composing messages
        return this.request<MinimalUser[]>(`${this.baseURL}/users?minimal=true`);
    }
}

export const adminMessageService = new AdminMessageService();