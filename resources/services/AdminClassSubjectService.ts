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
    // 🔗 CLASS SUBJECT MANAGEMENT (SCHEDULING)
    // ========================================================================

    /**
     * Get class subjects for a specific class or with filters
     */
    async getClassSubjects(params: {
        class_id?: number;
        teacher_id?: number;
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