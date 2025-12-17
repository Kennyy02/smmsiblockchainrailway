// ========================================================================
// 🔐 ADMIN STUDENT SUBMISSION SERVICE
// Handles API calls for Student Submission management
// ========================================================================

// Reusing general interfaces and types from adminService.ts for consistency
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

// Interfaces for relationships
export interface MinimalStudent {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user: { id: number; name: string; email: string };
}

export interface MinimalAssignment {
    id: number;
    title: string;
    total_points: number;
    assignment_type: string;
    due_date: string;
    class_subject: {
        id: number;
        subject: { title: string; subject_code: string };
        class: { class_code: string };
    };
}

export type SubmissionStatus = 'pending' | 'submitted' | 'graded';

// 📋 INTERFACE DEFINITIONS
export interface StudentSubmission {
    id: number;
    assignment_id: number;
    student_id: number;
    submission_text: string | null;
    submitted_at: string | null;
    score: number | null;
    teacher_feedback: string | null;
    created_at: string;
    
    // Computed properties (from StudentSubmission.php)
    status: SubmissionStatus;
    is_late: boolean;
    percentage_score: number | null;
    letter_grade: string | null;

    // Relationships
    assignment: MinimalAssignment;
    student: MinimalStudent;
}

export interface StudentSubmissionFormData {
    assignment_id: number;
    student_id: number;
    submission_text?: string;
    submitted_at?: string; 
}

export interface SubmissionGradeData {
    score: number;
    teacher_feedback?: string;
}

export interface SubmissionStats {
    total_submissions: number;
    submitted_count: number;
    graded_count: number;
    ungraded_count: number;
    pending_count: number;
    late_submissions: number;
    average_score: number;
}

export interface SubmissionsResponse extends ApiResponse<StudentSubmission[]> {
    pagination?: PaginationData;
}


// 🛠️ ADMIN STUDENT SUBMISSION SERVICE CLASS

class AdminStudentSubmissionService {
    private baseURL = '';

    // Replicating the base request logic
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

    // 📝 SUBMISSION ENDPOINTS
    
    /**
     * Get paginated list of student submissions
     */
    async getSubmissions(params: {
        page?: number;
        per_page?: number;
        assignment_id?: number;
        student_id?: number;
        status?: SubmissionStatus | 'ungraded' | 'pending';
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    } = {}): Promise<SubmissionsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        // Corrected endpoint path
        return this.request<StudentSubmission[]>(`${this.baseURL}/student-submissions?${searchParams.toString()}`) as Promise<SubmissionsResponse>;
    }

    /**
     * Get submission statistics
     */
    async getSubmissionStats(assignmentId?: number, studentId?: number): Promise<ApiResponse<SubmissionStats>> {
        const searchParams = new URLSearchParams();
        if (assignmentId) searchParams.append('assignment_id', assignmentId.toString());
        if (studentId) searchParams.append('student_id', studentId.toString());
        
        // Corrected endpoint path
        return this.request<SubmissionStats>(`${this.baseURL}/student-submissions/stats?${searchParams.toString()}`);
    }

    /**
     * Create new submission
     */
    async createSubmission(submissionData: StudentSubmissionFormData): Promise<ApiResponse<StudentSubmission>> {
        return this.request<StudentSubmission>(`${this.baseURL}/student-submissions`, {
            method: 'POST',
            body: JSON.stringify(submissionData),
        });
    }

    /**
     * Update existing submission (for teacher feedback/text)
     */
    async updateSubmission(id: number, submissionData: Partial<StudentSubmissionFormData>): Promise<ApiResponse<StudentSubmission>> {
        return this.request<StudentSubmission>(`${this.baseURL}/student-submissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(submissionData),
        });
    }
    
    /**
     * Grade a submission (Separate endpoint for grading)
     */
    async gradeSubmission(id: number, gradeData: SubmissionGradeData): Promise<ApiResponse<StudentSubmission>> {
        return this.request<StudentSubmission>(`${this.baseURL}/student-submissions/${id}/grade`, {
            method: 'PUT', // Changed to PUT to match common RESTful update practices
            body: JSON.stringify(gradeData),
        });
    }

    /**
     * Delete submission
     */
    async deleteSubmission(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/student-submissions/${id}`, {
            method: 'DELETE',
        });
    }
}

export const adminStudentSubmissionService = new AdminStudentSubmissionService();