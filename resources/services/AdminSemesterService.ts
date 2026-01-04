// ========================================================================
// 🔐 ADMIN SEMESTER SERVICE
// Handles API calls for Semester management
// ========================================================================

// Reusing interfaces from AdminAcademicYearService for consistency
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

// 📋 INTERFACE DEFINITIONS
export interface Semester {
    id: number;
    academic_year_id: number;
    semester_name: '1st Semester' | '2nd Semester' | 'Summer';
    start_date: string; // ISO Date string
    end_date: string; // ISO Date string
    is_current: boolean;
    academic_year: {
        id: number;
        year_name: string;
    };
    status: 'current' | 'active' | 'past'; // Computed status
    classes_count: number; // From withCount
    grades_count: number; // From withCount
    full_name: string;
}

export interface SemesterFormData {
    academic_year_id: number;
    semester_name: '1st Semester' | '2nd Semester' | 'Summer';
    start_date: string;
    end_date: string;
    is_current?: boolean;
}

export interface SemesterStats {
    total_semesters: number;
    current_semester: Semester | null;
    active_semesters_count: number;
    // Add other relevant stats if needed
}

export interface SemestersResponse extends ApiResponse<Semester[]> {
    pagination?: PaginationData;
}


// 🛠️ ADMIN SEMESTER SERVICE CLASS

class AdminSemesterService {
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
            // Ensure URL is absolute for cross-origin requests
            let csrfUrl = `${this.baseURL}/csrf-token`;
            if (!csrfUrl.startsWith('http://') && !csrfUrl.startsWith('https://')) {
                csrfUrl = window.location.origin + (csrfUrl.startsWith('/') ? csrfUrl : '/' + csrfUrl);
            }
            
            const response = await fetch(csrfUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include', // Changed to 'include' for cross-origin support
            });
            if (!response.ok) {
                throw new Error('Failed to fetch new CSRF token');
            }
            const data = await response.json();
            if (data.success && data.csrf_token) {
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', data.csrf_token);
                }
                return data.csrf_token;
            }
            throw new Error('Invalid CSRF token response');
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            throw new Error('Failed to refresh session. Please refresh the page manually.');
        }
    }

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        let csrfToken = this.getCsrfToken();
        
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
                ...options.headers,
            },
            credentials: 'include', // Changed to 'include' for cross-origin cookie support
        };

        // Merge options carefully - ensure headers are merged correctly
        const mergedOptions: RequestInit = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {}),
            }
        };

        try {
            const response = await fetch(absoluteUrl, mergedOptions);
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

            // Handle 401 Unauthorized - check if it's a real auth failure
            if (response.status === 401) {
                // Don't immediately redirect - let the component handle the error
                // This prevents automatic logout on temporary network issues
                console.warn('⚠️ Authentication error (401). This may be a temporary issue.');
                throw new Error('Unauthenticated. Please check your login status.');
            }

            if (!response.ok) {
                
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

    // 📚 SEMESTER ENDPOINTS
    
    async getSemesters(params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
        academic_year_id?: number;
    } = {}): Promise<SemestersResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Semester[]>(`${this.baseURL}/semesters?${searchParams.toString()}`) as Promise<SemestersResponse>;
    }

    async getSemester(id: number): Promise<ApiResponse<Semester>> {
        return this.request<Semester>(`${this.baseURL}/semesters/${id}`);
    }

    async getCurrentSemester(): Promise<ApiResponse<Semester>> {
        return this.request<Semester>(`${this.baseURL}/semesters/current`);
    }

    async getSemesterStats(): Promise<ApiResponse<SemesterStats>> {
        return this.request<SemesterStats>(`${this.baseURL}/semesters/stats`);
    }

    async getSemestersByAcademicYear(academicYearId: number): Promise<ApiResponse<Semester[]>> {
        return this.request<Semester[]>(`${this.baseURL}/semesters/academic-year/${academicYearId}`);
    }

    async createSemester(semesterData: SemesterFormData): Promise<ApiResponse<Semester>> {
        return this.request<Semester>(`${this.baseURL}/semesters`, {
            method: 'POST',
            body: JSON.stringify(semesterData),
        });
    }

    async updateSemester(id: number, semesterData: Partial<SemesterFormData>): Promise<ApiResponse<Semester>> {
        return this.request<Semester>(`${this.baseURL}/semesters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(semesterData),
        });
    }

    async deleteSemester(id: number, force: boolean = false): Promise<ApiResponse<null>> {
        const url = force ? `${this.baseURL}/semesters/${id}?force=true` : `${this.baseURL}/semesters/${id}`;
        return this.request<null>(url, {
            method: 'DELETE',
        });
    }

    // NOTE: activate/archive methods are in the controller but not exposed via simple API in the provided snippet. 
    // Assuming the main update endpoint handles is_current toggle.
}

export const adminSemesterService = new AdminSemesterService();