// ========================================================================
// 🔐 ADMIN SUBJECT SERVICE - School Management System
// Contains Management functionality for Academic Subjects
// ========================================================================

// ========================================================================
// 📋 INTERFACE DEFINITIONS
// ========================================================================

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

// ⭐ SUBJECT MANAGEMENT INTERFACES
export interface Teacher {
    id: number;
    teacher_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email: string;
}

export interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    units: number;
    description?: string;
    teacher_id?: number;
    teacher?: Teacher;
    teacher_name?: string;
    // Multiple teachers (many-to-many)
    assigned_teachers?: Teacher[];
    created_at: string;
}

export interface SubjectFormData {
    subject_code: string;
    subject_name: string;
    units: number;
    description?: string;
    teacher_id?: number | null; // Legacy single teacher
    teacher_ids?: number[]; // Multiple teachers
}

export interface SubjectStats {
    total_subjects: number;
    core_subjects: number;
    elective_subjects: number;
    by_department: { department_name: string; count: number }[];
}

export interface SubjectsResponse extends ApiResponse<Subject[]> {
    pagination?: PaginationData;
}


// ========================================================================
// 🛠️ ADMIN SUBJECT SERVICE CLASS
// ========================================================================

class AdminSubjectService {
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

    private async refreshCsrfToken(): Promise<string> {
        try {
            console.log('Fetching fresh CSRF token from /api/csrf-token...');
            const response = await fetch(`${this.baseURL}/csrf-token`, {
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

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        let csrfToken = this.getCsrfToken();
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
            },
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const contentType = response.headers.get('content-type');
            let data;
            
            // Handle 419 CSRF token mismatch BEFORE trying to parse JSON
            // Laravel returns HTML page for 419, not JSON
            if (response.status === 419 && retryOn419) {
                console.warn('CSRF token mismatch (419). Attempting to refresh token and retry...');
                try {
                    const newCsrfToken = await this.refreshCsrfToken();
                    // Retry the request with the new token, but prevent further retries
                    const retryOptions = {
                        ...options,
                        headers: {
                            ...defaultOptions.headers,
                            ...options.headers,
                            'X-CSRF-TOKEN': newCsrfToken,
                        },
                    };
                    return this.request<T>(url, retryOptions, false); // Do not retry again
                } catch (refreshError) {
                    console.error('Failed to refresh CSRF token:', refreshError);
                    throw new Error('CSRF token mismatch. Your session may have expired. Please refresh the page and try again.');
                }
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
                // Handle 401 Unauthorized - redirect to login
                if (response.status === 401) {
                    console.warn('Unauthorized request, redirecting to login...');
                    window.location.href = '/login';
                    throw new Error('Unauthorized. Please log in again.');
                }
                
                // Handle 419 again (in case retryOn419 was false)
                if (response.status === 419) {
                    throw new Error('CSRF token mismatch. Your session may have expired. Please refresh the page and try again.');
                }

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

    // ========================================================================
    // 📚 SUBJECT MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of subjects
     */
    async getSubjects(params: {
        page?: number;
        per_page?: number;
        search?: string;
        department_id?: number; 
        is_core?: boolean;
    } = {}): Promise<SubjectsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Subject[]>(`${this.baseURL}/subjects?${searchParams.toString()}`) as Promise<SubjectsResponse>;
    }

    /**
     * Get subject statistics
     */
    async getSubjectStats(): Promise<ApiResponse<SubjectStats>> {
        return this.request<SubjectStats>(`${this.baseURL}/subjects/stats`);
    }

    /**
     * Create new subject
     */
    async createSubject(subjectData: SubjectFormData): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects`, {
            method: 'POST',
            body: JSON.stringify(subjectData),
        });
    }

    /**
     * Update existing subject
     */
    async updateSubject(id: number, subjectData: Partial<SubjectFormData>): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(subjectData),
        });
    }

    /**
     * Delete subject
     */
    async deleteSubject(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/subjects/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Get a single subject by ID
     */
    async getSubject(id: number): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects/${id}`);
    }

    /**
     * Get all teachers for dropdown
     */
    async getTeachers(): Promise<ApiResponse<Teacher[]>> {
        return this.request<Teacher[]>(`${this.baseURL}/teachers?per_page=9999`);
    }
}

export const adminSubjectService = new AdminSubjectService();