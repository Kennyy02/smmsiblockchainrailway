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