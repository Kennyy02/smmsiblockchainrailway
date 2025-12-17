// ========================================================================
// 🔐 ADMIN ASSIGNMENT SERVICE
// Handles API calls for Assignment management
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
// Based on relationships used in Assignment.php and AssignmentController.php
export interface ClassSubject {
    id: number;
    class_id: number;
    subject_id: number;
    subject: {
        id: number;
        subject_code: string;
        title: string;
    };
    class: {
        id: number;
        class_code: string;
        class_name: string;
    };
    teacher_id?: number;
}

export type AssignmentType = 'Homework' | 'Quiz' | 'Exam' | 'Project';
export type AssignmentStatus = 'open' | 'due_soon' | 'overdue';

export interface Assignment {
    id: number;
    class_subject_id: number;
    title: string;
    description?: string;
    assignment_type: AssignmentType;
    total_points: number;
    due_date: string; // ISO Date string
    created_at: string;

    // Computed properties (from withCount and accessors in Assignment.php)
    full_title: string;
    status: AssignmentStatus;
    submissions_count: number; // total submissions (regardless of status)
    submitted_submissions_count: number; // submitted_submissions_count
    graded_submissions_count: number; // graded_submissions_count
    
    // Helper Method equivalents
    submission_rate?: number; // from getSubmissionRate
    average_score?: number; // from getAverageScore
    
    // Relationships
    class_subject: ClassSubject;
}

export interface AssignmentFormData {
    class_subject_id: number;
    title: string;
    description?: string;
    assignment_type: AssignmentType;
    total_points: number;
    due_date: string; // YYYY-MM-DD format
}

export interface AssignmentStats {
    total_assignments: number;
    upcoming_assignments: number;
    overdue_assignments: number;
    assignments_by_type: { assignment_type: AssignmentType; count: number }[];
    average_submission_rate: number;
}

export interface AssignmentsResponse extends ApiResponse<Assignment[]> {
    pagination?: PaginationData;
}

// Interface for ALL available filters, including the new teacher_id
export interface AssignmentFilters {
    page?: number;
    per_page?: number;
    search?: string;
    assignment_type?: AssignmentType;
    class_subject_id?: number;
    status?: AssignmentStatus | 'upcoming' | 'overdue' | 'due_soon';
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    // <<< ADDED FOR TEACHER FILTERING >>>
    teacher_id?: number; 
}


// 🛠️ ADMIN ASSIGNMENT SERVICE CLASS

class AdminAssignmentService {
    private baseURL = '/api';

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

    // 📝 ASSIGNMENT ENDPOINTS
    
    // Updated to use AssignmentFilters interface
    async getAssignments(params: AssignmentFilters = {}): Promise<AssignmentsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Assignment[]>(`${this.baseURL}/assignments?${searchParams.toString()}`) as Promise<AssignmentsResponse>;
    }

    async getAssignment(id: number): Promise<ApiResponse<Assignment>> {
        return this.request<Assignment>(`${this.baseURL}/assignments/${id}`);
    }

    // Updated to accept an optional teacherId
    async getAssignmentStats(classSubjectId?: number, teacherId?: number): Promise<ApiResponse<AssignmentStats>> {
        const searchParams = new URLSearchParams();
        if (classSubjectId) {
            searchParams.append('class_subject_id', classSubjectId.toString());
        }
        if (teacherId) {
            // <<< PASSING TEACHER ID FOR STATS FILTERING >>>
            searchParams.append('teacher_id', teacherId.toString()); 
        }
        
        const queryString = searchParams.toString();
        const url = `${this.baseURL}/assignments/stats${queryString ? '?' + queryString : ''}`;
            
        return this.request<AssignmentStats>(url);
    }

    async createAssignment(assignmentData: AssignmentFormData): Promise<ApiResponse<Assignment>> {
        return this.request<Assignment>(`${this.baseURL}/assignments`, {
            method: 'POST',
            body: JSON.stringify(assignmentData),
        });
    }

    async updateAssignment(id: number, assignmentData: Partial<AssignmentFormData>): Promise<ApiResponse<Assignment>> {
        return this.request<Assignment>(`${this.baseURL}/assignments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(assignmentData),
        });
    }

    // Includes force delete flag to match controller logic
    async deleteAssignment(id: number, force: boolean = false): Promise<ApiResponse<null>> {
        const url = force ? `${this.baseURL}/assignments/${id}?force=true` : `${this.baseURL}/assignments/${id}`;
        return this.request<null>(url, {
            method: 'DELETE',
        });
    }
    
    // Updated to accept an optional teacherId for filtering the dropdown list
    async getClassSubjects(teacherId?: number): Promise<ApiResponse<ClassSubject[]>> {
        const url = teacherId 
            ? `${this.baseURL}/class-subjects?paginate=false&teacher_id=${teacherId}`
            : `${this.baseURL}/class-subjects?paginate=false`;
            
        return this.request<ClassSubject[]>(url);
    }
}

export const adminAssignmentService = new AdminAssignmentService();