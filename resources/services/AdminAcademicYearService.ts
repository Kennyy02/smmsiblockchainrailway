// ========================================================================
// 🔐 ADMIN ACADEMIC YEAR SERVICE
// Handles API calls for AcademicYear management
// ========================================================================

// Reusing interfaces from AdminClassesService/adminService for consistency
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
export interface AcademicYear {
    id: number;
    year_name: string;
    start_date: string; // ISO Date string
    end_date: string; // ISO Date string
    is_current: boolean;
    status: 'current' | 'active' | 'past'; // Computed status
    semesters_count: number; // From withCount
    classes_count: number; // From withCount
    grades_count: number; // From withCount
}

export interface AcademicYearFormData {
    year_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface AcademicYearStats {
    total_years: number;
    current_year: AcademicYear | null;
    active_years_count: number;
    // Add other relevant stats if needed
}

export interface AcademicYearsResponse extends ApiResponse<AcademicYear[]> {
    pagination?: PaginationData;
}


// 🛠️ ADMIN ACADEMIC YEAR SERVICE CLASS

class AdminAcademicYearService {
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
            const response = await fetch(`${this.baseURL}/csrf-token`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
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

    // 📚 ACADEMIC YEAR ENDPOINTS
    
    async getAcademicYears(params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
    } = {}): Promise<AcademicYearsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<AcademicYear[]>(`${this.baseURL}/academic-years?${searchParams.toString()}`) as Promise<AcademicYearsResponse>;
    }

    async getAcademicYear(id: number): Promise<ApiResponse<AcademicYear>> {
        return this.request<AcademicYear>(`${this.baseURL}/academic-years/${id}`);
    }

    async getCurrentAcademicYear(): Promise<ApiResponse<AcademicYear>> {
        return this.request<AcademicYear>(`${this.baseURL}/academic-years/current`);
    }

    async getAcademicYearStats(): Promise<ApiResponse<AcademicYearStats>> {
        return this.request<AcademicYearStats>(`${this.baseURL}/academic-years/stats`);
    }

    async createAcademicYear(yearData: AcademicYearFormData): Promise<ApiResponse<AcademicYear>> {
        return this.request<AcademicYear>(`${this.baseURL}/academic-years`, {
            method: 'POST',
            body: JSON.stringify(yearData),
        });
    }

    async updateAcademicYear(id: number, yearData: Partial<AcademicYearFormData>): Promise<ApiResponse<AcademicYear>> {
        return this.request<AcademicYear>(`${this.baseURL}/academic-years/${id}`, {
            method: 'PUT',
            body: JSON.stringify(yearData),
        });
    }

    async deleteAcademicYear(id: number, force: boolean = false): Promise<ApiResponse<null>> {
        const url = force ? `${this.baseURL}/academic-years/${id}?force=true` : `${this.baseURL}/academic-years/${id}`;
        return this.request<null>(url, {
            method: 'DELETE',
        });
    }

    async activateAcademicYear(id: number): Promise<ApiResponse<AcademicYear>> {
        return this.request<AcademicYear>(`${this.baseURL}/academic-years/${id}/activate`, {
            method: 'POST',
        });
    }
}

export const adminAcademicYearService = new AdminAcademicYearService();