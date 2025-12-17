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
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
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