// ========================================================================
// 🔐 ADMIN ANNOUNCEMENT SERVICE - School Management System
// Handles API calls for Announcement management
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

// Minimal interfaces for relationships
export interface MinimalUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

// 📋 ANNOUNCEMENT INTERFACE DEFINITIONS

export type TargetAudience = 'All' | 'Teachers' | 'Students' | 'Parents';
export type AnnouncementStatus = 'Published' | 'Draft' | 'Scheduled';

export interface Announcement {
    id: number;
    created_by: number;
    title: string;
    content: string;
    target_audience: TargetAudience;
    published_at: string | null; // Null for draft, future date for scheduled
    expires_at: string | null; // Null for no expiration, date for expiration
    created_at: string;

    // Relationships (Eager Loaded)
    creator: {
        id: number;
        user: MinimalUser;
    };
    status: AnnouncementStatus; // Computed attribute
    audience_badge_color: string; // Computed attribute
    content_preview: string;
}

export interface AnnouncementFormData {
    title: string;
    content: string;
    target_audience: TargetAudience;
    published_at: string | null;
    expires_at: string | null;
}

export interface AnnouncementStats {
    total_announcements: number;
    published_count: number;
    draft_count: number;
    scheduled_count: number;
    today_count: number;
    by_audience: { audience: TargetAudience; count: number; }[];
}

export interface AnnouncementsResponse extends ApiResponse<Announcement[]> {
    pagination?: PaginationData;
}

// 🛠️ ADMIN ANNOUNCEMENT SERVICE CLASS

class AdminAnnouncementService {
    private baseURL = '/api'; 

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

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = this.getCsrfToken();
        
        // Ensure URL is absolute - always use full URL to avoid redirects
        let absoluteUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Use window.location.origin to create absolute URL
            absoluteUrl = window.location.origin + (url.startsWith('/') ? url : '/' + url);
        }
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include', // Changed from 'same-origin' to 'include' to ensure cookies are sent
        };

        try {
            // Merge options carefully - ensure headers are merged correctly
            const mergedOptions: RequestInit = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {}),
                }
            };
            
            const response = await fetch(absoluteUrl, mergedOptions);
            const contentType = response.headers.get('content-type');
            let data: any;
            
            // Handle 419 CSRF token mismatch - Laravel returns HTML page, not JSON
            if (response.status === 419) {
                const text = await response.text();
                console.error('CSRF token mismatch (419). Response:', text.substring(0, 200));
                throw new Error('CSRF token mismatch. Your session may have expired. Please refresh the page (F5) and try again.');
            }
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                if (response.status >= 400) {
                    throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
                }
                throw new Error('Unexpected response format from server');
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

    // 📣 ANNOUNCEMENT ENDPOINTS
    
    async getAnnouncements(params: {
        page?: number;
        per_page?: number;
        search?: string; 
        audience?: TargetAudience;
        status?: AnnouncementStatus;
    } = {}): Promise<AnnouncementsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                // PHP controller seems to handle 'published_only' based on presence, simulating status filter
                if (key === 'status') {
                    if (value === 'Published') searchParams.append('published_only', 'true');
                    // Draft and Scheduled would typically be handled by separate custom API endpoints if filtering is needed on index
                } else {
                     searchParams.append(key, value.toString());
                }
            }
        });
        return this.request<Announcement[]>(`${this.baseURL}/announcements?${searchParams.toString()}`) as Promise<AnnouncementsResponse>;
    }

    async getAnnouncement(id: number): Promise<ApiResponse<Announcement>> {
        return this.request<Announcement>(`${this.baseURL}/announcements/${id}`);
    }

    async getAnnouncementStats(): Promise<ApiResponse<AnnouncementStats>> {
        // Assuming a dedicated endpoint for announcement stats
        return this.request<AnnouncementStats>(`${this.baseURL}/announcements/stats`);
    }

    async createAnnouncement(announcementData: AnnouncementFormData): Promise<ApiResponse<Announcement>> {
        return this.request<Announcement>(`${this.baseURL}/announcements`, {
            method: 'POST',
            body: JSON.stringify(announcementData),
        });
    }

    async updateAnnouncement(id: number, announcementData: Partial<AnnouncementFormData>): Promise<ApiResponse<Announcement>> {
        return this.request<Announcement>(`${this.baseURL}/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(announcementData),
        });
    }

    async deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/announcements/${id}`, {
            method: 'DELETE',
        });
    }
}

export const adminAnnouncementService = new AdminAnnouncementService();