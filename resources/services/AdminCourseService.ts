// ========================================================================
// 🔐 ADMIN COURSE SERVICE - School Management System
// Manages academic programs/courses (BSMT, BSMarE, BSIT, etc.)
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
    description?: string;
    level: 'College' | 'Senior High' | 'Junior High' | 'Elementary';
    duration_years: number;
    is_active: boolean;
    students_count?: number;
    classes_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CourseFormData {
    course_code: string;
    course_name: string;
    description?: string;
    level: string;
    duration_years: number;
    is_active: boolean;
}

export interface CourseStats {
    total_courses: number;
    active_courses: number;
    by_level: { level: string; count: number }[];
    total_students: number;
}

export interface CoursesResponse extends ApiResponse<Course[]> {
    pagination?: PaginationData;
}

// ========================================================================
// 🛠️ ADMIN COURSE SERVICE CLASS
// ========================================================================

class AdminCourseService {
    private baseURL = '/api';

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
    // 📚 COURSE MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of courses
     */
    async getCourses(params: {
        page?: number;
        per_page?: number;
        search?: string;
        level?: string;
        is_active?: boolean;
        paginate?: string;
    } = {}): Promise<CoursesResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Course[]>(`${this.baseURL}/courses?${searchParams.toString()}`) as Promise<CoursesResponse>;
    }

    /**
     * Get active courses for dropdowns
     */
    async getActiveCourses(): Promise<ApiResponse<Course[]>> {
        return this.request<Course[]>(`${this.baseURL}/courses/active`);
    }

    /**
     * Get course statistics
     */
    async getCourseStats(): Promise<ApiResponse<CourseStats>> {
        return this.request<CourseStats>(`${this.baseURL}/courses/stats`);
    }

    /**
     * Get a single course
     */
    async getCourse(id: number): Promise<ApiResponse<Course>> {
        return this.request<Course>(`${this.baseURL}/courses/${id}`);
    }

    /**
     * Create a new course
     */
    async createCourse(data: CourseFormData): Promise<ApiResponse<Course>> {
        return this.request<Course>(`${this.baseURL}/courses`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a course
     */
    async updateCourse(id: number, data: Partial<CourseFormData>): Promise<ApiResponse<Course>> {
        return this.request<Course>(`${this.baseURL}/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a course
     */
    async deleteCourse(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/courses/${id}`, {
            method: 'DELETE',
        });
    }
}

export const adminCourseService = new AdminCourseService();

