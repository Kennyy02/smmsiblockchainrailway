// ========================================================================
// 🔐 ADMIN CLASSES SERVICE - School Management System
// Contains Management functionality for Classes/Sections
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

// ⭐ CLASS MANAGEMENT INTERFACES
export interface Class {
    id: number;
    class_code: string;
    class_name: string;
    year_level: number;
    section: string;
    program: string; 
    course_id?: number | null;
    course?: Course;
    academic_year_id: number;
    semester_id: number;
    adviser_id: number | null;
    student_count: number;
    adviser_name?: string;
    created_at: string;
}

export interface ClassFormData {
    class_code: string;
    class_name: string;
    year_level: number;
    section: string;
    program: string;
    course_id?: number | null;
    academic_year_id: number;
    semester_id: number;
    adviser_id?: number | null;
}

export interface ClassStats {
    total_classes: number;
    total_students_enrolled: number;
    total_advisers_assigned: number;
    total_courses: number;
    by_program: { program: string; count: number }[];
}

export interface ClassesResponse extends ApiResponse<Class[]> {
    pagination?: PaginationData;
}

// ⭐ DROPDOWN OPTIONS INTERFACES
export interface AcademicYear {
    id: number;
    year_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface Semester {
    id: number;
    academic_year_id: number;
    semester_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface Teacher {
    id: number;
    teacher_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email: string;
    department: string;
}

export interface Course {
    id: number;
    course_code: string;
    course_name: string;
    level: string;
    duration_years: number;
    is_active: boolean;
}

// ⭐ STUDENT & ENROLLMENT INTERFACES
export interface Student {
    id: number;
    student_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email: string;
    program?: string;
    year_level: number;
    status?: string;
    enrollment_status?: string;
    enrollment_date?: string;
}

export interface Enrollment {
    id: number;
    student_id: number;
    class_id: number;
    academic_year_id: number;
    semester_id: number;
    course_id?: number;
    enrollment_date: string;
    status: 'enrolled' | 'dropped' | 'completed' | 'withdrawn';
    remarks?: string;
    student?: Student;
}

export interface ClassStudentsResponse extends ApiResponse<Student[]> {
    pagination?: PaginationData;
    class_info?: Class;
}

export interface BulkEnrollmentData {
    class_id: number;
    student_ids: number[];
    academic_year_id?: number;
    semester_id?: number;
}

// ========================================================================
// 🛠️ ADMIN CLASSES SERVICE CLASS
// ========================================================================

class AdminClassesService {
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

    // ========================================================================
    // 🏫 CLASS MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of classes
     */
    async getClasses(params: {
        page?: number;
        per_page?: number;
        search?: string;
        program?: string;
        year_level?: string | number;
        academic_year_id?: number;
    } = {}): Promise<ClassesResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Class[]>(`${this.baseURL}/classes?${searchParams.toString()}`) as Promise<ClassesResponse>;
    }

    /**
     * Get class statistics
     */
    async getClassStats(): Promise<ApiResponse<ClassStats>> {
        return this.request<ClassStats>(`${this.baseURL}/classes/stats`);
    }

    /**
     * Create new class
     */
    async createClass(classData: ClassFormData): Promise<ApiResponse<Class>> {
        return this.request<Class>(`${this.baseURL}/classes`, {
            method: 'POST',
            body: JSON.stringify(classData),
        });
    }

    /**
     * Update existing class
     */
    async updateClass(id: number, classData: Partial<ClassFormData>): Promise<ApiResponse<Class>> {
        return this.request<Class>(`${this.baseURL}/classes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(classData),
        });
    }

    /**
     * Delete class
     * @param force - If true, will delete class even if it has students/enrollments
     */
    async deleteClass(id: number, force: boolean = true): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/classes/${id}?force=${force}`, {
            method: 'DELETE',
        });
    }

    /**
     * Assign a teacher as an adviser to a class
     */
    async assignAdviser(classId: number, teacherId: number | null): Promise<ApiResponse<Class>> {
        return this.request<Class>(`${this.baseURL}/classes/${classId}`, {
            method: 'PUT',
            body: JSON.stringify({ adviser_id: teacherId }),
        });
    }

    // ========================================================================
    // 📚 DROPDOWN OPTIONS (NEW)
    // ========================================================================

    /**
     * Get all academic years
     */
    async getAcademicYears(): Promise<ApiResponse<AcademicYear[]>> {
        return this.request<AcademicYear[]>(`${this.baseURL}/academic-years`);
    }

    /**
     * Get semesters by academic year
     */
    async getSemesters(academicYearId?: number): Promise<ApiResponse<Semester[]>> {
        const url = academicYearId 
            ? `${this.baseURL}/semesters?academic_year_id=${academicYearId}`
            : `${this.baseURL}/semesters`;
        return this.request<Semester[]>(url);
    }

    /**
     * Get all teachers for adviser selection
     */
    async getTeachers(params: {
        paginate?: boolean;
        department?: string;
    } = {}): Promise<ApiResponse<Teacher[]>> {
        const searchParams = new URLSearchParams();
        searchParams.append('paginate', 'false'); // Get all teachers for dropdown
        
        if (params.department) {
            searchParams.append('department', params.department);
        }
        
        return this.request<Teacher[]>(`${this.baseURL}/teachers?${searchParams.toString()}`);
    }

    /**
     * Get active courses for dropdown selection
     */
    async getActiveCourses(): Promise<ApiResponse<Course[]>> {
        return this.request<Course[]>(`${this.baseURL}/courses/active`);
    }

    // ========================================================================
    // 👥 CLASS STUDENT ENROLLMENT MANAGEMENT
    // ========================================================================

    /**
     * Get all students enrolled in a specific class
     */
    async getClassStudents(classId: number, params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
    } = {}): Promise<ClassStudentsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Student[]>(`${this.baseURL}/classes/${classId}/students?${searchParams.toString()}`) as Promise<ClassStudentsResponse>;
    }

    /**
     * Get available students (not enrolled in the class) for enrollment
     */
    async getAvailableStudents(classId: number, params: {
        page?: number;
        per_page?: number;
        search?: string;
        program?: string;
        year_level?: number;
    } = {}): Promise<ApiResponse<Student[]>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Student[]>(`${this.baseURL}/classes/${classId}/available-students?${searchParams.toString()}`);
    }

    /**
     * Enroll a single student to a class
     */
    async enrollStudent(classId: number, studentId: number): Promise<ApiResponse<Enrollment>> {
        return this.request<Enrollment>(`${this.baseURL}/classes/${classId}/enroll`, {
            method: 'POST',
            body: JSON.stringify({ student_id: studentId }),
        });
    }

    /**
     * Bulk enroll multiple students to a class
     */
    async bulkEnrollStudents(classId: number, studentIds: number[]): Promise<ApiResponse<{ enrolled: number; failed: number; errors?: string[] }>> {
        return this.request<{ enrolled: number; failed: number; errors?: string[] }>(`${this.baseURL}/classes/${classId}/bulk-enroll`, {
            method: 'POST',
            body: JSON.stringify({ student_ids: studentIds }),
        });
    }

    /**
     * Remove/Unenroll a student from a class
     */
    async unenrollStudent(classId: number, studentId: number, remarks?: string): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/classes/${classId}/unenroll/${studentId}`, {
            method: 'DELETE',
            body: JSON.stringify({ remarks }),
        });
    }

    /**
     * Update enrollment status (e.g., mark as dropped, completed)
     */
    async updateEnrollmentStatus(classId: number, studentId: number, status: string, remarks?: string): Promise<ApiResponse<Enrollment>> {
        return this.request<Enrollment>(`${this.baseURL}/classes/${classId}/enrollment/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify({ status, remarks }),
        });
    }
}

export const adminClassesService = new AdminClassesService();