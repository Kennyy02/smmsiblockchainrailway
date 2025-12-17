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
    private baseURL = '';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
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
     */
    async deleteStudent(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/students/${id}`, {
            method: 'DELETE',
        });
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