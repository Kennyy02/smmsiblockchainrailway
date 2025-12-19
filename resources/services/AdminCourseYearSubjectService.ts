// ========================================================================
// 🔐 ADMIN COURSE-YEAR-SUBJECT SERVICE - Curriculum Management
// Links courses, year levels, and subjects to define curriculum structure
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

export interface Course {
    id: number;
    course_code: string;
    course_name: string;
    level?: string;
    is_active?: boolean;
}

export interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    description?: string;
    units?: number;
}

export interface CourseYearSubject {
    id: number;
    course_id: number;
    year_level: number;
    subject_id: number;
    semester: '1st' | '2nd' | 'summer';
    is_required: boolean;
    units: number;
    description?: string;
    is_active: boolean;
    course?: Course;
    subject?: Subject;
    created_at?: string;
    updated_at?: string;
}

export interface CourseYearSubjectFormData {
    course_id: number;
    year_level: number;
    subject_id: number;
    semester: '1st' | '2nd' | 'summer';
    is_required?: boolean;
    units?: number;
    description?: string;
}

export interface BulkLinkFormData {
    course_id: number;
    year_level: number;
    semester: '1st' | '2nd' | 'summer';
    subject_ids: number[];
}

export interface CourseYearSubjectStats {
    total_links: number;
    active_links: number;
    total_courses: number;
    total_subjects: number;
    by_course: { course_code: string; course_name: string; count: number }[];
    by_year_level: { year_level: number; count: number }[];
}

export interface CourseYearSubjectsResponse extends ApiResponse<CourseYearSubject[]> {
    pagination?: PaginationData;
}

// ========================================================================
// 🛠️ ADMIN COURSE-YEAR-SUBJECT SERVICE CLASS
// ========================================================================

class AdminCourseYearSubjectService {
    private baseURL = '/api/course-year-subjects';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        // Get CSRF token from meta tag (should be in <head>)
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Fallback: Try to get from Inertia page props if available
        if (!csrfToken && typeof window !== 'undefined') {
            try {
                // Access Inertia's internal page data
                const inertiaData = (window as any).__INERTIA_DATA__;
                if (inertiaData?.page?.props?.csrf_token) {
                    csrfToken = inertiaData.page.props.csrf_token;
                } else if ((window as any).Inertia?.page?.props?.csrf_token) {
                    csrfToken = (window as any).Inertia.page.props.csrf_token;
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        if (!csrfToken) {
            console.warn('⚠️ CSRF token not found. Please ensure the meta tag is present in the HTML head.');
        }
        
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
            
            // Handle 401 Unauthorized - redirect to login
            if (response.status === 401) {
                console.error('❌ Authentication failed. Redirecting to login...');
                // Redirect to login page
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                throw new Error('Unauthenticated. Please log in again.');
            }
            
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

    // ========================================================================
    // CRUD OPERATIONS
    // ========================================================================

    async getCourseYearSubjects(params: {
        page?: number;
        per_page?: number;
        course_id?: string | number;
        year_level?: string | number;
        semester?: string;
        search?: string;
    } = {}): Promise<CourseYearSubjectsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<CourseYearSubject[]>(`${this.baseURL}?${searchParams.toString()}`) as Promise<CourseYearSubjectsResponse>;
    }

    async getStats(): Promise<ApiResponse<CourseYearSubjectStats>> {
        return this.request<CourseYearSubjectStats>(`${this.baseURL}/stats`);
    }

    async createLink(data: CourseYearSubjectFormData): Promise<ApiResponse<CourseYearSubject>> {
        return this.request<CourseYearSubject>(this.baseURL, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async bulkCreateLinks(data: BulkLinkFormData): Promise<ApiResponse<{ created_count: number; skipped_count: number }>> {
        return this.request<{ created_count: number; skipped_count: number }>(`${this.baseURL}/bulk`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLink(id: number, data: Partial<CourseYearSubjectFormData & { is_active?: boolean }>): Promise<ApiResponse<CourseYearSubject>> {
        return this.request<CourseYearSubject>(`${this.baseURL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteLink(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/${id}`, {
            method: 'DELETE',
        });
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    async getSubjectsForCourseYear(params: {
        course_id?: number;
        year_level?: number;
        semester?: string;
    }): Promise<ApiResponse<CourseYearSubject[]>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<CourseYearSubject[]>(`${this.baseURL}/for-course-year?${searchParams.toString()}`);
    }

    async getAvailableSubjects(params: {
        course_id: number;
        year_level: number;
        semester: string;
    }): Promise<ApiResponse<Subject[]>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Subject[]>(`${this.baseURL}/available-subjects?${searchParams.toString()}`);
    }

    // Get active courses for dropdown
    async getCourses(): Promise<ApiResponse<Course[]>> {
        return this.request<Course[]>('/api/courses/active');
    }

    // Get all subjects for dropdown
    async getSubjects(): Promise<ApiResponse<Subject[]>> {
        return this.request<Subject[]>('/api/subjects');
    }
}

export const adminCourseYearSubjectService = new AdminCourseYearSubjectService();

