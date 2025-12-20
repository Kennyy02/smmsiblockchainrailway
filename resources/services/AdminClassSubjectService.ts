// ========================================================================
// 🔐 ADMIN CLASS SUBJECT SERVICE - School Management System
// Manages the linking of Classes, Subjects, Teachers (Schedules)
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

// ⭐ CLASS SUBJECT MANAGEMENT INTERFACES
export interface ClassSubject {
    id: number;
    class_id: number;
    subject_id: number;
    teacher_id: number | null;
    room_id: number | null;
    schedule_data: string;
    academic_year_id: number;
    semester_id: number;
    // Relationships loaded:
    subject_code?: string;
    subject_name?: string;
    class_name?: string;
    teacher_name?: string;
    room_name?: string;
    academic_year_name?: string;
    semester_name?: string;
}

export interface ClassSubjectFormData {
    class_id: number;
    subject_id: number;
    teacher_id: number | null;
    academic_year_id: number;
    semester_id: number;
}

export interface ClassSubjectsResponse extends ApiResponse<ClassSubject[]> {
    pagination?: PaginationData;
}

// ⭐ DROPDOWN OPTIONS INTERFACES
export interface ClassOption {
    id: number;
    class_code: string;
    class_name: string;
    year_level: number;
    section: string;
    program: string;
}

export interface SubjectOption {
    id: number;
    subject_code: string;
    subject_name: string;
    description?: string;
    units?: number;
    teacher_id?: number | null; // Legacy single teacher
    assigned_teachers?: { id: number; full_name: string }[]; // Multiple teachers (many-to-many)
}

export interface TeacherOption {
    id: number;
    teacher_id: string;
    full_name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    department?: string;
    email: string;
}

export interface AcademicYearOption {
    id: number;
    year_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface SemesterOption {
    id: number;
    semester_name: string;
    academic_year_id: number;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface DropdownOptions {
    classes: ClassOption[];
    subjects: SubjectOption[];
    teachers: TeacherOption[];
    academicYears: AcademicYearOption[];
    semesters: SemesterOption[];
}

// ========================================================================
// 🛠️ ADMIN CLASS SUBJECT SERVICE CLASS
// ========================================================================

class AdminClassSubjectService {
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
        
        const makeRequest = async (token: string): Promise<Response> => {
            const defaultOptions: RequestInit = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers,
                },
                credentials: 'same-origin',
            };

            return fetch(url, { ...defaultOptions, ...options });
        };

        try {
            let response = await makeRequest(csrfToken);
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error('Unexpected response format from server');
            }

            // Handle CSRF token mismatch (419) - retry with fresh token
            if (response.status === 419 && retryOn419) {
                console.warn('CSRF token mismatch detected. Attempting to refresh token...');
                const freshToken = await this.refreshCsrfToken();
                
                if (freshToken) {
                    // Retry the request with the fresh token (only once)
                    response = await makeRequest(freshToken);
                    
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        throw new Error('Unexpected response format from server');
                    }
                } else {
                    console.error('CSRF token mismatch. Could not refresh token. Please refresh the page.');
                    throw new Error('Session expired. Please refresh the page and try again.');
                }
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
    // 🔗 CLASS SUBJECT MANAGEMENT (SCHEDULING)
    // ========================================================================

    /**
     * Get class subjects for a specific class or with filters
     * class_id and teacher_id can be numeric IDs or text for searching (class code/name, teacher name)
     */
    async getClassSubjects(params: {
        class_id?: number | string;
        teacher_id?: number | string;
        academic_year_id?: number;
        semester_id?: number;
        search?: string;
        page?: number;
        per_page?: number;
    } = {}): Promise<ClassSubjectsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<ClassSubject[]>(`${this.baseURL}/class-subjects?${searchParams.toString()}`) as Promise<ClassSubjectsResponse>;
    }

    /**
     * Link a subject to a class (Create new ClassSubject entry)
     */
    async linkSubjectToClass(classSubjectData: ClassSubjectFormData): Promise<ApiResponse<ClassSubject>> {
        return this.request<ClassSubject>(`${this.baseURL}/class-subjects`, {
            method: 'POST',
            body: JSON.stringify(classSubjectData),
        });
    }

    /**
     * Update an existing ClassSubject entry (e.g., change teacher, room, or schedule)
     */
    async updateClassSubject(id: number, classSubjectData: Partial<ClassSubjectFormData>): Promise<ApiResponse<ClassSubject>> {
        return this.request<ClassSubject>(`${this.baseURL}/class-subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(classSubjectData),
        });
    }

    /**
     * Unlink a subject from a class (Delete ClassSubject entry)
     */
    async deleteClassSubject(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/class-subjects/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get the full schedule for a specific class
     */
    async getScheduleForClass(classId: number): Promise<ApiResponse<ClassSubject[]>> {
        return this.request<ClassSubject[]>(`${this.baseURL}/classes/${classId}/schedule`);
    }

    /**
     * Get the full schedule for a specific teacher
     */
    async getScheduleForTeacher(teacherId: number): Promise<ApiResponse<ClassSubject[]>> {
        return this.request<ClassSubject[]>(`${this.baseURL}/teachers/${teacherId}/schedule`);
    }

    // ========================================================================
    // 📦 DROPDOWN OPTIONS FETCHING
    // ========================================================================

    /**
     * Get all classes for dropdown selection
     */
    async getClasses(): Promise<ApiResponse<ClassOption[]>> {
        return this.request<ClassOption[]>(`${this.baseURL}/classes`);
    }

    /**
     * Get all subjects for dropdown selection
     */
    async getSubjects(): Promise<ApiResponse<SubjectOption[]>> {
        return this.request<SubjectOption[]>(`${this.baseURL}/subjects`);
    }

    /**
     * Get all teachers for dropdown selection
     */
    async getTeachers(): Promise<ApiResponse<TeacherOption[]>> {
        return this.request<TeacherOption[]>(`${this.baseURL}/teachers`);
    }

    /**
     * Get all academic years for dropdown selection
     */
    async getAcademicYears(): Promise<ApiResponse<AcademicYearOption[]>> {
        return this.request<AcademicYearOption[]>(`${this.baseURL}/academic-years`);
    }

    /**
     * Get all semesters for dropdown selection
     */
    async getSemesters(): Promise<ApiResponse<SemesterOption[]>> {
        return this.request<SemesterOption[]>(`${this.baseURL}/semesters`);
    }

    /**
     * Get current academic year
     */
    async getCurrentAcademicYear(): Promise<ApiResponse<AcademicYearOption>> {
        return this.request<AcademicYearOption>(`${this.baseURL}/academic-years/current`);
    }

    /**
     * Get current semester
     */
    async getCurrentSemester(): Promise<ApiResponse<SemesterOption>> {
        return this.request<SemesterOption>(`${this.baseURL}/semesters/current`);
    }

    /**
     * Get all dropdown options in a single call (optimized)
     * This method fetches all required dropdown data in parallel for better performance
     */
    async getAllDropdownOptions(): Promise<DropdownOptions> {
        try {
            const [classesRes, subjectsRes, teachersRes, academicYearsRes, semestersRes] = await Promise.all([
                this.getClasses(),
                this.getSubjects(),
                this.getTeachers(),
                this.getAcademicYears(),
                this.getSemesters()
            ]);

            return {
                classes: classesRes.data || [],
                subjects: subjectsRes.data || [],
                teachers: teachersRes.data || [],
                academicYears: academicYearsRes.data || [],
                semesters: semestersRes.data || []
            };
        } catch (error) {
            console.error('❌ ERROR FETCHING DROPDOWN OPTIONS:', error);
            throw error;
        }
    }

    /**
     * Get default form values (current academic year and semester)
     */
    async getDefaultFormValues(): Promise<{ academic_year_id: number; semester_id: number }> {
        try {
            const [currentAYRes, currentSemRes] = await Promise.all([
                this.getCurrentAcademicYear().catch(() => null),
                this.getCurrentSemester().catch(() => null)
            ]);

            return {
                academic_year_id: currentAYRes?.data?.id || 0,
                semester_id: currentSemRes?.data?.id || 0
            };
        } catch (error) {
            console.error('❌ ERROR FETCHING DEFAULT VALUES:', error);
            return { academic_year_id: 0, semester_id: 0 };
        }
    }
}

export const adminClassSubjectService = new AdminClassSubjectService();