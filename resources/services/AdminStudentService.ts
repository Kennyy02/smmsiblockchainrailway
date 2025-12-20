// ========================================================================
// 🔐 ADMIN STUDENT SERVICE - School Management System
// Contains Student Management functionality
// ========================================================================


// Interfaces common to all services
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

// ⭐ STUDENT MANAGEMENT INTERFACES
export interface ParentGuardian {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email?: string;
    phone?: string;
    relationship?: string;
    pivot?: {
        student_id: number;
        parent_id: number;
        relationship: string;
    };
}

export interface Student {
    id: number;
    user_id: number; // Required for linking to User model
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    gender?: string;
    phone?: string;
    address?: string;
    program: string; // Matches PHP controller field
    year_level: number;
    full_name: string;
    current_class_id: number | null;
    section?: string;
    enrollment_date?: string;
    total_subjects: number; // Placeholder/Computed
    date_of_birth: string;
    course?: { id: number; code: string; name: string; level?: string };
    parents?: ParentGuardian[]; // Parent/Guardian information
}

export interface ParentGuardianFormData {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    relationship: string; // e.g., 'Father', 'Mother', 'Guardian'
    password?: string;
    password_confirmation?: string;
}

export interface StudentFormData {
    user_id?: number; 
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    gender?: string;
    phone?: string;
    address?: string;
    program: string; // Use 'program' to match PHP controller field
    year_level: number;
    date_of_birth: string; 
    password?: string;
    password_confirmation?: string;
    // Parent/Guardian information
    parent_guardian?: ParentGuardianFormData;
}

export interface StudentStats {
    total_students: number;
    active_students: number;
    inactive_students: number;
    by_course: { course: string; count: number }[];
    by_education_level: {
        college: number;
        senior_high: number;
        junior_high: number;
        elementary: number;
    };
}

export interface StudentsResponse extends ApiResponse<Student[]> {
    pagination?: PaginationData;
}

export interface Course {
    id: number;
    course_code: string;
    course_name: string;
    level?: string;
    is_active?: boolean;
}


// ========================================================================
// 🛠️ ADMIN STUDENT SERVICE CLASS
// ========================================================================

class AdminStudentService {
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

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        const csrfToken = this.getCsrfToken();
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include', // Changed from 'same-origin' to 'include' to ensure cookies are sent
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
                // Handle 401 Unauthorized - redirect to login
                if (response.status === 401) {
                    console.warn('Unauthorized request, redirecting to login...');
                    window.location.href = '/login';
                    throw new Error('Unauthorized. Please log in again.');
                }
                
                // Handle 419 CSRF token mismatch
                if (response.status === 419) {
                    console.error('CSRF token mismatch (419). Current token:', csrfToken ? csrfToken.substring(0, 10) + '...' : 'missing');
                    
                    if (retryOn419) {
                        // Try to get a fresh token and retry once
                        try {
                            // Force re-read the token from all sources
                            const freshToken = this.getCsrfToken();
                            if (freshToken && freshToken !== csrfToken) {
                                console.log('Token refreshed, retrying request with new token...');
                                // Retry with fresh token
                                const retryOptions = {
                                    ...options,
                                    headers: {
                                        ...defaultOptions.headers,
                                        ...options.headers,
                                        'X-CSRF-TOKEN': freshToken,
                                    }
                                };
                                return this.request<T>(url, retryOptions, false); // Don't retry again
                            }
                        } catch (e) {
                            console.error('Could not refresh CSRF token:', e);
                        }
                    }
                    
                    // If we still get 419, show user-friendly error
                    const errorMsg = 'Your session has expired. Please refresh the page and try again.';
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
                
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
    // 🎓 STUDENT MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of students
     */
    async getStudents(params: {
        page?: number;
        per_page?: number;
        search?: string;
        program?: string;
        year_level?: string | number;
        year_level_min?: number; // For education level range filtering
        year_level_max?: number;
        status?: string; // 'active' or 'inactive'
    } = {}): Promise<StudentsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Student[]>(`${this.baseURL}/students?${searchParams.toString()}`) as Promise<StudentsResponse>;
    }

    /**
     * Get student statistics (assuming API route: /students/stats)
     */
    async getStudentStats(): Promise<ApiResponse<StudentStats>> {
        return this.request<StudentStats>(`${this.baseURL}/students/stats`);
    }

    /**
     * Create new student
     */
    async createStudent(studentData: StudentFormData): Promise<ApiResponse<Student>> {
        return this.request<Student>(`${this.baseURL}/students`, {
            method: 'POST',
            body: JSON.stringify(studentData),
        });
    }

    /**
     * Update existing student
     */
    async updateStudent(id: number, studentData: Partial<StudentFormData>): Promise<ApiResponse<Student>> {
        return this.request<Student>(`${this.baseURL}/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData),
        });
    }

    /**
     * Delete student
     * Refreshes CSRF token from server before making the request
     */
    async deleteStudent(id: number): Promise<ApiResponse<null>> {
        try {
            // First, try to refresh the CSRF token by making a simple request
            // This ensures the session is active and we have a valid token
            try {
                await fetch('/api/students/stats', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
            } catch (e) {
                // If stats request fails, continue anyway
                console.warn('Could not refresh session:', e);
            }
            
            // Get a fresh CSRF token right before the DELETE request
            const freshToken = this.getCsrfToken();
            
            // Make the DELETE request with explicit credentials and fresh token
            return this.request<null>(`${this.baseURL}/students/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': freshToken,
                },
                credentials: 'include', // Ensure cookies are sent
            });
        } catch (error) {
            // If delete fails with 419, suggest page refresh
            if (error instanceof Error && error.message.includes('CSRF') || error.message.includes('419')) {
                throw new Error('Session expired. Please refresh the page (F5) and try again.');
            }
            throw error;
        }
    }
    
    /**
     * Get a single student by ID
     */
    async getStudent(id: number): Promise<ApiResponse<Student>> {
        return this.request<Student>(`${this.baseURL}/students/${id}`);
    }

    /**
     * Get student transcript
     */
    async getStudentTranscript(id: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/students/${id}/transcript`);
    }

    /**
     * Get active courses for dropdowns
     */
    async getCourses(): Promise<ApiResponse<Course[]>> {
        return this.request<Course[]>(`/api/courses/active`);
    }

    /**
     * Export students to CSV - Organized format with all information
     */
    exportStudentsToCSV(students: Student[], filename: string = 'students_report.csv'): void {
        // Define CSV headers - organized columns
        const headers = [
            'No.',
            'Student ID',
            'Last Name',
            'First Name', 
            'Middle Name',
            'Email',
            'Phone',
            'Address',
            'Date of Birth',
            'Program/Course',
            'Education Level',
            'Grade/Year Level',
            'Section',
            'Status',
            'Parent/Guardian Name',
            'Parent Relationship',
            'Parent Phone',
            'Enrollment Date'
        ];
        
        // Format year level for display
        const formatYearLevel = (yearLevel: number): string => {
            if (yearLevel >= 13) {
                const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
                return yearNames[yearLevel - 13] || `${yearLevel - 12}th Year`;
            }
            return `Grade ${yearLevel}`;
        };

        // Get education level
        const getEducationLevel = (yearLevel: number): string => {
            if (yearLevel >= 13) return 'College';
            if (yearLevel >= 11) return 'Senior High';
            if (yearLevel >= 7) return 'Junior High';
            return 'Elementary';
        };

        // Convert students to CSV rows with all info
        const rows = students.map((student, index) => {
            const parent = student.parents && student.parents.length > 0 ? student.parents[0] : null;
            return [
                index + 1,
                student.student_id,
                student.last_name,
                student.first_name,
                student.middle_name || '',
                student.email || '',
                student.phone || '',
                student.address || '',
                student.date_of_birth || '',
                student.course?.name || student.program || '',
                getEducationLevel(student.year_level),
                formatYearLevel(student.year_level),
                student.section || '',
                student.current_class_id ? 'Active' : 'Inactive',
                parent?.full_name || '',
                parent?.pivot?.relationship || '',
                parent?.phone || '',
                student.enrollment_date || ''
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export const adminStudentService = new AdminStudentService();