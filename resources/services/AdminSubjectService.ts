// ========================================================================
// 🔐 ADMIN SUBJECT SERVICE - School Management System
// Contains Management functionality for Academic Subjects
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

// ⭐ SUBJECT MANAGEMENT INTERFACES
export interface Teacher {
    id: number;
    teacher_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email: string;
}

export interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    units: number;
    description?: string;
    teacher_id?: number;
    teacher?: Teacher;
    teacher_name?: string;
    // Multiple teachers (many-to-many)
    assigned_teachers?: Teacher[];
    created_at: string;
}

export interface SubjectFormData {
    subject_code: string;
    subject_name: string;
    units: number;
    description?: string;
    teacher_id?: number | null; // Legacy single teacher
    teacher_ids?: number[]; // Multiple teachers
}

export interface SubjectStats {
    total_subjects: number;
    core_subjects: number;
    elective_subjects: number;
    by_department: { department_name: string; count: number }[];
}

export interface SubjectsResponse extends ApiResponse<Subject[]> {
    pagination?: PaginationData;
}


// ========================================================================
// 🛠️ ADMIN SUBJECT SERVICE CLASS
// ========================================================================

class AdminSubjectService {
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
    // 📚 SUBJECT MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of subjects
     */
    async getSubjects(params: {
        page?: number;
        per_page?: number;
        search?: string;
        department_id?: number; 
        is_core?: boolean;
    } = {}): Promise<SubjectsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Subject[]>(`${this.baseURL}/subjects?${searchParams.toString()}`) as Promise<SubjectsResponse>;
    }

    /**
     * Get subject statistics
     */
    async getSubjectStats(): Promise<ApiResponse<SubjectStats>> {
        return this.request<SubjectStats>(`${this.baseURL}/subjects/stats`);
    }

    /**
     * Create new subject
     */
    async createSubject(subjectData: SubjectFormData): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects`, {
            method: 'POST',
            body: JSON.stringify(subjectData),
        });
    }

    /**
     * Update existing subject
     */
    async updateSubject(id: number, subjectData: Partial<SubjectFormData>): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(subjectData),
        });
    }

    /**
     * Delete subject
     */
    async deleteSubject(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/subjects/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Get a single subject by ID
     */
    async getSubject(id: number): Promise<ApiResponse<Subject>> {
        return this.request<Subject>(`${this.baseURL}/subjects/${id}`);
    }

    /**
     * Get all teachers for dropdown
     */
    async getTeachers(): Promise<ApiResponse<Teacher[]>> {
        return this.request<Teacher[]>(`${this.baseURL}/teachers?per_page=9999`);
    }
}

export const adminSubjectService = new AdminSubjectService();