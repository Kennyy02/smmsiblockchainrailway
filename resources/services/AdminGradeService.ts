// ========================================================================
// 📚 ADMIN GRADE SERVICE - School Management System (UPDATED FOR TEACHER ID)
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

// 📋 INTERFACE DEFINITIONS
// Minimal relationships needed for Grade display/forms

export interface MinimalStudent {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

export interface MinimalClassSubject {
    id: number;
    class_id: number;
    subject_id: number;
    academic_year_id: number;  // Added for convenience
    semester_id: number;        // Added for convenience
    subject: {
        id: number;
        subject_code: string;
        subject_name: string;
    };
    class: {
        id: number;
        class_code: string;
        class_name: string;
    };
    full_name: string; // e.g., 'BSMT-1A - MATH 101'
}

export interface AcademicYearOption {
    id: number;
    year_name: string;
    is_current: boolean;
}

export interface SemesterOption {
    id: number;
    semester_name: string;
    is_current: boolean;
}

export type GradeRemarks = 'Passed' | 'Failed' | 'Incomplete';

export interface Grade {
    id: number;
    class_subject_id: number;
    student_id: number;
    academic_year_id: number;
    semester_id: number;
    prelim_grade: number | null;
    midterm_grade: number | null;
    final_grade: number | null;
    final_rating: number | null;
    remarks: GradeRemarks;
    created_at: string;

    // Relationships
    student: MinimalStudent;
    class_subject: MinimalClassSubject;
}

// Fixed: Added missing required fields
export interface GradeFormData {
    class_subject_id: number;
    student_id: number;
    academic_year_id: number;  // REQUIRED by backend
    semester_id: number;        // REQUIRED by backend
    prelim_grade?: number | null;
    midterm_grade?: number | null;
    final_grade?: number | null;
    final_rating?: number | null;
    remarks?: GradeRemarks;
}

export interface GradeStats {
    total_grades: number;
    average_final_rating: number;
    passing_rate: number; // Percentage
    failed_count: number;
    passed_grades: number; // Added to match Grades.tsx logic
    by_class_subject: { class_subject_name: string; average_rating: number; }[];
}

export interface GradesResponse extends ApiResponse<Grade[]> {
    pagination?: PaginationData;
}

// <<< NEW/UPDATED INTERFACE FOR FILTERS >>>
export interface GradeFilters {
    page?: number;
    per_page?: number;
    search?: string; // Search on student name or subject title
    class_subject_id?: number;
    student_id?: number;
    academic_year_id?: number;
    semester_id?: number;
    remarks?: GradeRemarks;
    teacher_id?: number; // <--- CRITICAL: ADDED FILTER
}


// 🛠️ ADMIN GRADE SERVICE CLASS

class AdminGradeService {
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

    // 📊 GRADE ENDPOINTS
    
    // Updated to use the GradeFilters interface which includes teacher_id
    async getGrades(params: GradeFilters = {}): Promise<GradesResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Grade[]>(`${this.baseURL}/grades?${searchParams.toString()}`) as Promise<GradesResponse>;
    }

    async getGrade(id: number): Promise<ApiResponse<Grade>> {
        return this.request<Grade>(`${this.baseURL}/grades/${id}`);
    }

    async getGradesByStudent(studentId: number): Promise<ApiResponse<Grade[]>> {
        return this.request<Grade[]>(`${this.baseURL}/grades/student/${studentId}`);
    }

    async getGradesByClassSubject(classSubjectId: number): Promise<ApiResponse<Grade[]>> {
        return this.request<Grade[]>(`${this.baseURL}/grades/class-subject/${classSubjectId}`);
    }

    // Updated to accept filtering parameters, including teacher_id
    async getGradeStats(params: { 
        class_subject_id?: number, 
        academic_year_id?: number, 
        semester_id?: number, 
        teacher_id?: number // <--- CRITICAL: ADDED FILTER
    } = {}): Promise<ApiResponse<GradeStats>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        const queryString = searchParams.toString();
        const url = `${this.baseURL}/grades/stats${queryString ? '?' + queryString : ''}`;
        
        return this.request<GradeStats>(url);
    }

    async createGrade(gradeData: GradeFormData): Promise<ApiResponse<Grade>> {
        return this.request<Grade>(`${this.baseURL}/grades`, {
            method: 'POST',
            body: JSON.stringify(gradeData),
        });
    }

    async updateGrade(id: number, gradeData: Partial<GradeFormData>): Promise<ApiResponse<Grade>> {
        return this.request<Grade>(`${this.baseURL}/grades/${id}`, {
            method: 'PUT',
            body: JSON.stringify(gradeData),
        });
    }

    async deleteGrade(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/grades/${id}`, {
            method: 'DELETE',
        });
    }
    
    // Helper to fetch ClassSubjects for dropdowns (now accepts teacherId)
    async getClassSubjectsMinimal(teacherId?: number): Promise<ApiResponse<MinimalClassSubject[]>> {
        const url = teacherId 
            ? `${this.baseURL}/class-subjects?paginate=false&teacher_id=${teacherId}`
            : `${this.baseURL}/class-subjects?paginate=false`;
        
        const response = await this.request<any>(url);
        
        // Handle both direct array and wrapped response
        if (response.success) {
            if (Array.isArray(response.data)) {
                return response as ApiResponse<MinimalClassSubject[]>;
            }
            return {
                success: true,
                data: response.data || []
            };
        }
        
        return { success: false, data: [] };
    }

    // Helper to fetch minimal list of students for dropdowns
    async getStudentsMinimal(classId?: number): Promise<ApiResponse<MinimalStudent[]>> {
        // If classId is provided, fetch students for that specific class
        if (classId) {
            try {
                const response = await this.request<any>(`${this.baseURL}/classes/${classId}/students?per_page=9999`);
                console.log('📚 getStudentsMinimal response for classId', classId, ':', response);
                
                if (response.success) {
                    // The API returns { success: true, data: [...students...] }
                    const students = Array.isArray(response.data) ? response.data : [];
                    
                    // Transform the response to MinimalStudent format
                    const transformedStudents = students.map((s: any) => ({
                        id: s.id,
                        student_id: s.student_id,
                        first_name: s.first_name,
                        last_name: s.last_name,
                        full_name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim()
                    }));
                    
                    console.log('📚 Transformed students:', transformedStudents);
                    return {
                        success: true,
                        data: transformedStudents
                    };
                }
                console.warn('⚠️ getStudentsMinimal: response.success is false');
                return { success: false, data: [] };
            } catch (error) {
                console.error('❌ Error in getStudentsMinimal:', error);
                return { success: false, data: [] };
            }
        }
        
        // Fetch all students (with high per_page to get all)
        const response = await this.request<any>(`${this.baseURL}/students?per_page=9999`);
        
        // Handle both direct array and paginated response
        if (response.success) {
            // If data is an array, return as-is
            if (Array.isArray(response.data)) {
                return response as ApiResponse<MinimalStudent[]>;
            }
            // If data has a nested structure (paginated), extract the items
            return {
                success: true,
                data: response.data || []
            };
        }
        
        return { success: false, data: [] };
    }

    // Helper to fetch academic years for dropdowns
    async getAcademicYears(): Promise<ApiResponse<AcademicYearOption[]>> {
        return this.request<AcademicYearOption[]>(`${this.baseURL}/academic-years`);
    }

    // Helper to fetch semesters for dropdowns
    async getSemesters(): Promise<ApiResponse<SemesterOption[]>> {
        return this.request<SemesterOption[]>(`${this.baseURL}/semesters`);
    }

    // Helper to get current academic year
    async getCurrentAcademicYear(): Promise<ApiResponse<AcademicYearOption>> {
        return this.request<AcademicYearOption>(`${this.baseURL}/academic-years/current`);
    }

    // Helper to get current semester
    async getCurrentSemester(): Promise<ApiResponse<SemesterOption>> {
        return this.request<SemesterOption>(`${this.baseURL}/semesters/current`);
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

    /**
     * Get all dropdown options needed for the grade form (now filtered by teacherId)
     */
    async getAllDropdownOptions(teacherId?: number): Promise<{ // <--- CRITICAL: ADDED PARAMETER
        classSubjects: MinimalClassSubject[];
        students: MinimalStudent[];
        academicYears: AcademicYearOption[];
        semesters: SemesterOption[];
    }> {
        try {
            const [classSubjectsRes, studentsRes, academicYearsRes, semestersRes] = await Promise.all([
                this.getClassSubjectsMinimal(teacherId), // <--- CRITICAL: FILTERED CALL
                this.getStudentsMinimal(),
                this.getAcademicYears(),
                this.getSemesters()
            ]);

            return {
                classSubjects: classSubjectsRes.data || [],
                students: studentsRes.data || [],
                academicYears: academicYearsRes.data || [],
                semesters: semestersRes.data || []
            };
        } catch (error) {
            console.error('❌ ERROR FETCHING DROPDOWN OPTIONS:', error);
            throw error;
        }
    }
}

export const adminGradeService = new AdminGradeService();